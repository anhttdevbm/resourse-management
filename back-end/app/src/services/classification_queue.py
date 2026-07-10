"""Hàng đợi phân loại tự động qua Redis list + worker thread trong API."""
from __future__ import annotations

import json
import logging
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from decouple import config
from redis import Redis
from redis.exceptions import RedisError

from app.src import models
from app.src.services.auto_classification_engine import (
    apply_rule_to_payload,
    file_extension_from_filename,
    get_effective_rules,
    pick_first_matching_rule,
)
from app.src.utils.connection.sql_connection import SessionLocal

logger = logging.getLogger(__name__)

QUEUE_KEY = "classification:queue"
JOB_KEY_PREFIX = "classification:job:"
USER_JOBS_PREFIX = "classification:user:"
JOB_TTL_SECONDS = 7 * 24 * 3600  # giữ job 7 ngày

_ASSIGN_TO_RESOURCE = (
    ("assign_stage_id", "stage_id"),
    ("assign_product_type_id", "product_type_id"),
    ("assign_platform_id", "platform_id"),
    ("assign_status_id", "status_id"),
    ("assign_repo_id", "repo_id"),
)

_redis: Optional[Redis] = None
_worker_started = False
_worker_lock = threading.Lock()


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis(
            host=config("REDIS_HOST", default="localhost"),
            port=config("REDIS_PORT", default=6379, cast=int),
            password=config("REDIS_PASSWORD", default=None) or None,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=5,
        )
    return _redis


def _job_key(job_id: str) -> str:
    return f"{JOB_KEY_PREFIX}{job_id}"


def _user_jobs_key(user_id: str) -> str:
    return f"{USER_JOBS_PREFIX}{user_id}"


def enqueue_classification_job(
    *,
    resource_id: str,
    user_id: str,
    filename: str,
    resource_name: str,
    fill_keys: List[str],
    tag_id_from_upload: Optional[str] = None,
) -> Dict[str, Any]:
    """Đẩy job vào Redis. Trả về dict job (status=pending)."""
    job_id = str(uuid.uuid4())
    now = _utcnow_iso()
    job: Dict[str, Any] = {
        "id": job_id,
        "resource_id": str(resource_id),
        "user_id": str(user_id),
        "filename": filename or "",
        "resource_name": resource_name or "",
        "fill_keys": list(fill_keys or []),
        "tag_id_from_upload": tag_id_from_upload,
        "status": "pending",
        "error": None,
        "result": None,
        "created_at": now,
        "updated_at": now,
    }
    client = get_redis()
    pipe = client.pipeline()
    pipe.setex(_job_key(job_id), JOB_TTL_SECONDS, json.dumps(job, default=str))
    pipe.lpush(_user_jobs_key(str(user_id)), job_id)
    pipe.ltrim(_user_jobs_key(str(user_id)), 0, 199)
    pipe.lpush(QUEUE_KEY, job_id)
    pipe.execute()
    return job


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    raw = get_redis().get(_job_key(job_id))
    if not raw:
        return None
    return json.loads(raw)


def _save_job(job: Dict[str, Any]) -> None:
    job["updated_at"] = _utcnow_iso()
    get_redis().setex(_job_key(job["id"]), JOB_TTL_SECONDS, json.dumps(job, default=str))


def list_user_jobs(user_id: str, *, limit: int = 50) -> List[Dict[str, Any]]:
    client = get_redis()
    ids = client.lrange(_user_jobs_key(str(user_id)), 0, max(0, limit - 1))
    jobs: List[Dict[str, Any]] = []
    for jid in ids:
        job = get_job(jid)
        if job:
            jobs.append(job)
    return jobs


def queue_stats(user_id: str) -> Dict[str, int]:
    jobs = list_user_jobs(user_id, limit=200)
    stats = {"total": len(jobs), "pending": 0, "processing": 0, "completed": 0, "failed": 0}
    for job in jobs:
        status = job.get("status") or "pending"
        if status in stats:
            stats[status] += 1
    return stats


def process_classification_job(job_id: str) -> None:
    """Xử lý một job: áp dụng rule lên resource đã tạo."""
    job = get_job(job_id)
    if not job:
        logger.warning("Classification job missing: %s", job_id)
        return
    if job.get("status") == "completed":
        return

    job["status"] = "processing"
    job["error"] = None
    _save_job(job)

    session = SessionLocal()
    try:
        resource_id = uuid.UUID(str(job["resource_id"]))
        user_id = uuid.UUID(str(job["user_id"]))
        resource = (
            session.query(models.Resource)
            .filter(models.Resource.id == resource_id, models.Resource.is_deleted.is_(False))
            .first()
        )
        if not resource:
            raise ValueError("Resource not found")

        fill_keys = set(job.get("fill_keys") or [])
        # Payload chỉ coi các field trong fill_keys là trống → only_fill_empty hoạt động đúng
        payload: Dict[str, Any] = {
            "name": job.get("resource_name") or resource.name or "",
            "stage_id": None if "stage_id" in fill_keys else str(resource.stage_id) if resource.stage_id else None,
            "product_type_id": None
            if "product_type_id" in fill_keys
            else str(resource.product_type_id)
            if resource.product_type_id
            else None,
            "platform_id": None
            if "platform_id" in fill_keys
            else str(resource.platform_id)
            if resource.platform_id
            else None,
            "status_id": None if "status_id" in fill_keys else str(resource.status_id) if resource.status_id else None,
            "repo_id": None if "repo_id" in fill_keys else str(resource.repo_id) if resource.repo_id else None,
            "tag_id": None if "tag_id" in fill_keys else None,
        }

        rules = get_effective_rules(session, user_id)
        filename = job.get("filename") or ""
        extension = file_extension_from_filename(filename)
        matched = pick_first_matching_rule(rules, name=str(payload["name"]), extension=extension)

        assigned: Dict[str, Any] = {}
        tag_id: Optional[str] = None
        if matched:
            tag_id = apply_rule_to_payload(matched, payload, only_fill_empty=True)
            for assign_attr, field in _ASSIGN_TO_RESOURCE:
                if field not in fill_keys:
                    continue
                value = getattr(matched, assign_attr, None)
                if value:
                    setattr(resource, field, value)
                    assigned[field] = str(value)

        if not tag_id and job.get("tag_id_from_upload") and "tag_id" in fill_keys:
            tag_id = str(job["tag_id_from_upload"])

        if tag_id and "tag_id" in fill_keys:
            from sqlalchemy import delete, insert

            from app.src.models.resource_has_resource_tag import resource_resource_tag

            session.execute(
                delete(resource_resource_tag).where(
                    resource_resource_tag.c.resource_id == resource.id
                )
            )
            tag = (
                session.query(models.ResourceTag)
                .filter(
                    models.ResourceTag.id == uuid.UUID(str(tag_id)),
                    models.ResourceTag.is_deleted.is_(False),
                )
                .first()
            )
            if tag:
                session.execute(
                    insert(resource_resource_tag).values(
                        resource_id=resource.id,
                        resource_tag_id=tag.id,
                        is_deleted=False,
                    )
                )
                assigned["tag_id"] = str(tag_id)

        session.commit()
        job["status"] = "completed"
        job["result"] = {
            "matched_rule_id": str(matched.id) if matched else None,
            "matched_rule_title": matched.title if matched else None,
            "assigned": assigned,
        }
        _save_job(job)
        logger.info("Classification job %s completed for resource %s", job_id, resource_id)
    except Exception as exc:
        session.rollback()
        logger.exception("Classification job %s failed: %s", job_id, exc)
        job["status"] = "failed"
        job["error"] = str(exc)
        try:
            _save_job(job)
        except Exception:
            logger.exception("Failed to persist failed job status for %s", job_id)
    finally:
        session.close()


def _worker_loop(stop_event: threading.Event) -> None:
    logger.info("Classification queue worker started")
    while not stop_event.is_set():
        try:
            client = get_redis()
            item = client.brpop(QUEUE_KEY, timeout=2)
            if not item:
                continue
            _, job_id = item
            process_classification_job(job_id)
        except RedisError as exc:
            logger.warning("Classification worker Redis error: %s", exc)
            time.sleep(2)
        except Exception as exc:
            logger.exception("Classification worker unexpected error: %s", exc)
            time.sleep(1)
    logger.info("Classification queue worker stopped")


def start_classification_worker() -> None:
    """Khởi động worker daemon (idempotent)."""
    global _worker_started
    with _worker_lock:
        if _worker_started:
            return
        stop_event = threading.Event()
        thread = threading.Thread(
            target=_worker_loop,
            args=(stop_event,),
            name="classification-queue-worker",
            daemon=True,
        )
        thread.start()
        _worker_started = True

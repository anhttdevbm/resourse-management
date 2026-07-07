#!/usr/bin/env python3
"""
Seed dữ liệu demo — mô phỏng hệ thống đã vận hành ~3 tháng, file tải được thật.

Chạy tự động khi docker compose up (local + deploy) nếu SEED_DEMO_DATA=true.
Idempotent: user/resource chỉ tạo lần đầu; file luôn được backfill nếu thiếu.

Biến môi trường:
  SEED_DEMO_DATA=true|false
  SEED_DEMO_PASSWORD=Demo@2026!
  BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_EMAILS — user admin nhận dữ liệu seed
  BOOTSTRAP_ADMIN_PASSWORD — tạo admin nếu chưa có
"""
from __future__ import annotations

import os
import random
import sys
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import bootstrap_env  # noqa: F401

bootstrap_env.configure_env()

import decouple
from sqlalchemy import text

from app.src.services.s3_connection import S3Storage
from app.src.utils.connection.sql_connection import engine
from app.src.utils.security import get_password_hash

from scripts.seed_demo_files import (
    ensure_resource_file,
    local_file_exists,
    resource_storage_paths,
    s3_object_exists,
    upload_seed_file,
)

_NS = uuid.NAMESPACE_DNS
_MARKER_EMAIL = "nguyen.van.a@demo.local"
_DEMO_PASSWORD_DEFAULT = "Demo@2026!"
_DEFAULT_ADMIN_EMAIL = "anhttdevbm@gmail.com"

_DEMO_USERS = [
    ("nguyen.van.a@demo.local", "Nguyễn Văn A"),
    ("tran.thi.b@demo.local", "Trần Thị B"),
    ("le.van.c@demo.local", "Lê Văn C"),
    ("pham.thi.d@demo.local", "Phạm Thị D"),
    ("hoang.van.e@demo.local", "Hoàng Văn E"),
]

_REPOS: dict[str, list[str]] = {
    _DEFAULT_ADMIN_EMAIL: ["Kho quản trị hệ thống", "Bản phát hành production"],
    "nguyen.van.a@demo.local": ["Kho phát hành chính", "Bản beta nội bộ"],
    "tran.thi.b@demo.local": ["Backend builds", "API artifacts"],
    "le.van.c@demo.local": ["QA test packages", "Regression builds"],
    "pham.thi.d@demo.local": ["Design assets", "UI kits"],
    "hoang.van.e@demo.local": ["Infra releases", "Server images"],
}

_TAGS: dict[str, list[str]] = {
    _DEFAULT_ADMIN_EMAIL: ["admin", "release", "core"],
    "nguyen.van.a@demo.local": ["mobile", "release", "priority-high"],
    "tran.thi.b@demo.local": ["api", "backend", "microservice"],
    "le.van.c@demo.local": ["qa", "regression", "staging"],
    "pham.thi.d@demo.local": ["ui", "design", "figma-export"],
    "hoang.van.e@demo.local": ["devops", "docker", "infra"],
}

# (name, version, stage, platform, product_type, status, ext, owner_email, days_ago, repo_idx, tag_idx)
_RESOURCES = [
    # --- Admin anhttdevbm@gmail.com ---
    ("RMS Admin Console Guide", "3.0", "Production", "Web", "Document", "Approved", "pdf", _DEFAULT_ADMIN_EMAIL, 4, 0, 0),
    ("Platform Deployment Runbook", "2.1", "Production", "Web", "Document", "Approved", "md", _DEFAULT_ADMIN_EMAIL, 12, 0, 1),
    ("Core API Release Pack", "3.2.1", "Production", "Linux", "Archive", "Approved", "zip", _DEFAULT_ADMIN_EMAIL, 9, 1, 0),
    ("RMS Mobile Release APK", "3.0.0", "Production", "Android", "Mobile App", "Approved", "apk", _DEFAULT_ADMIN_EMAIL, 2, 0, 2),
    ("Windows Admin Tool", "1.2.0", "Production", "Windows", "Desktop Software", "Approved", "exe", _DEFAULT_ADMIN_EMAIL, 7, 0, 0),
    ("Brand Asset Pack 2026", "1.0", "Production", "Web", "Media", "Approved", "png", _DEFAULT_ADMIN_EMAIL, 18, 1, 1),
    ("Staging Snapshot July", "2026.07", "Staging", "Linux", "Archive", "Approved", "zip", _DEFAULT_ADMIN_EMAIL, 3, 1, 1),
    ("Security Policy Draft", "0.9", "Development", "Web", "Document", "Pending", "pdf", _DEFAULT_ADMIN_EMAIL, 1, 0, 2),
    ("Executive Summary Q2", "2026.2", "Production", "Web", "Document", "Approved", "pdf", _DEFAULT_ADMIN_EMAIL, 25, 0, 0),
    ("Infra Monitoring Bundle", "1.4", "Production", "Linux", "Archive", "Approved", "zip", _DEFAULT_ADMIN_EMAIL, 14, 1, 0),
    # --- Demo users ---
    ("RMS Mobile Android 2.1.0", "2.1.0", "Production", "Android", "Mobile App", "Approved", "apk", "nguyen.van.a@demo.local", 2, 0, 0),
    ("RMS Mobile Android 2.0.8", "2.0.8", "Production", "Android", "Mobile App", "Approved", "apk", "nguyen.van.a@demo.local", 18, 0, 0),
    ("RMS Mobile Android 2.0.5", "2.0.5", "Staging", "Android", "Mobile App", "Approved", "apk", "nguyen.van.a@demo.local", 35, 1, 1),
    ("RMS Mobile AAB Release", "2.1.0", "Production", "Android", "Mobile App", "Approved", "aab", "nguyen.van.a@demo.local", 3, 0, 0),
    ("HR Portal Windows", "1.4.2", "Production", "Windows", "Desktop Software", "Approved", "exe", "tran.thi.b@demo.local", 7, 0, 0),
    ("HR Portal Windows MSI", "1.4.2", "Production", "Windows", "Desktop Software", "Approved", "msi", "tran.thi.b@demo.local", 8, 0, 0),
    ("HR Portal macOS", "1.4.0", "Production", "macOS", "Desktop Software", "Approved", "dmg", "tran.thi.b@demo.local", 22, 0, 0),
    ("API Gateway Config Pack", "3.2.1", "Staging", "Linux", "Archive", "Approved", "zip", "tran.thi.b@demo.local", 14, 1, 1),
    ("Auth Service Build", "1.8.0", "Development", "Linux", "Desktop Software", "Pending", "deb", "tran.thi.b@demo.local", 1, 1, 1),
    ("Notification Worker", "0.9.4", "Development", "Linux", "Desktop Software", "Pending", "deb", "tran.thi.b@demo.local", 0, 1, 1),
    ("QA Regression Suite Q1", "2026.1", "Staging", "Web", "Archive", "Approved", "zip", "le.van.c@demo.local", 28, 0, 0),
    ("QA Regression Suite Q2", "2026.2", "Staging", "Web", "Archive", "Approved", "zip", "le.van.c@demo.local", 12, 0, 0),
    ("UAT Test Report March", "1.0", "Development", "Web", "Document", "Approved", "pdf", "le.van.c@demo.local", 40, 1, 1),
    ("UAT Test Report April", "1.0", "Development", "Web", "Document", "Approved", "pdf", "le.van.c@demo.local", 25, 1, 1),
    ("Smoke Test APK", "1.0.0-rc3", "Staging", "Android", "Mobile App", "Pending", "apk", "le.van.c@demo.local", 4, 0, 2),
    ("Dashboard UI Kit", "4.0", "Production", "Web", "Document", "Approved", "zip", "pham.thi.d@demo.local", 30, 0, 0),
    ("Brand Guidelines 2026", "2.0", "Production", "Web", "Document", "Approved", "pdf", "pham.thi.d@demo.local", 55, 0, 0),
    ("Icon Set RMS", "1.2", "Production", "Web", "Media", "Approved", "png", "pham.thi.d@demo.local", 20, 1, 1),
    ("Onboarding Screens Mockup", "1.0", "Development", "Web", "Media", "Approved", "png", "pham.thi.d@demo.local", 10, 1, 1),
    ("Promo Video Launch", "1.0", "Production", "Web", "Media", "Approved", "mp4", "pham.thi.d@demo.local", 15, 0, 0),
    ("Server Agent Linux", "2.3.0", "Production", "Linux", "Desktop Software", "Approved", "deb", "hoang.van.e@demo.local", 16, 0, 0),
    ("Docker Compose Stack", "1.1", "Production", "Linux", "Archive", "Approved", "zip", "hoang.van.e@demo.local", 33, 0, 0),
    ("K8s Manifests Staging", "0.8", "Staging", "Linux", "Archive", "Approved", "zip", "hoang.van.e@demo.local", 9, 1, 1),
    ("Monitoring Stack ISO", "2026.03", "Production", "Linux", "Archive", "Approved", "iso", "hoang.van.e@demo.local", 45, 0, 2),
    ("Legacy Migration Archive", "0.1", "Development", "Web", "Archive", "Rejected", "rar", "hoang.van.e@demo.local", 60, 1, 0),
    ("Internal API Spec", "3.0", "Production", "Web", "Document", "Approved", "docx", "tran.thi.b@demo.local", 42, 1, 0),
    ("Release Notes Q2", "2026.2", "Production", "Web", "Document", "Approved", "md", "nguyen.van.a@demo.local", 6, 0, 2),
    ("Sprint Demo Recording", "S24", "Staging", "Web", "Media", "Approved", "mp4", "nguyen.van.a@demo.local", 11, 1, 1),
    ("Windows Hotfix KB-1042", "1.0.1", "Production", "Windows", "Desktop Software", "Approved", "exe", "tran.thi.b@demo.local", 5, 0, 0),
    ("Mobile Beta Feedback Pack", "1.0", "Development", "Android", "Document", "Pending", "pdf", "le.van.c@demo.local", 3, 1, 0),
]

_SEARCH_QUERIES = [
    ("android", 8, 2),
    ("hr portal", 4, 1),
    ("qa regression", 3, 1),
    ("docker", 5, 2),
    ("api spec", 2, 1),
    ("ui kit", 3, 1),
    ("release notes", 2, 1),
    ("windows installer", 3, 1),
    ("admin console", 4, 1),
    ("deployment", 3, 1),
]

_SHARES = [
    ("RMS Mobile Android 2.1.0", "2.1.0", "tran.thi.b@demo.local", False),
    ("RMS Mobile Android 2.1.0", "2.1.0", _DEFAULT_ADMIN_EMAIL, False),
    ("HR Portal Windows", "1.4.2", "le.van.c@demo.local", False),
    ("Core API Release Pack", "3.2.1", _DEFAULT_ADMIN_EMAIL, True),
    ("Dashboard UI Kit", "4.0", "nguyen.van.a@demo.local", False),
    ("API Gateway Config Pack", "3.2.1", "hoang.van.e@demo.local", True),
    ("QA Regression Suite Q2", "2026.2", "tran.thi.b@demo.local", False),
    ("Server Agent Linux", "2.3.0", "tran.thi.b@demo.local", False),
    ("Brand Guidelines 2026", "2.0", "pham.thi.d@demo.local", False),
    ("Promo Video Launch", "1.0", "nguyen.van.a@demo.local", False),
    ("RMS Admin Console Guide", "3.0", "nguyen.van.a@demo.local", False),
]

_FAVORITES = [
    (_DEFAULT_ADMIN_EMAIL, "RMS Admin Console Guide", "3.0"),
    (_DEFAULT_ADMIN_EMAIL, "Core API Release Pack", "3.2.1"),
    (_DEFAULT_ADMIN_EMAIL, "RMS Mobile Release APK", "3.0.0"),
    ("nguyen.van.a@demo.local", "RMS Mobile Android 2.1.0", "2.1.0"),
    ("nguyen.van.a@demo.local", "Release Notes Q2", "2026.2"),
    ("tran.thi.b@demo.local", "HR Portal Windows", "1.4.2"),
    ("tran.thi.b@demo.local", "Internal API Spec", "3.0"),
    ("le.van.c@demo.local", "QA Regression Suite Q2", "2026.2"),
    ("le.van.c@demo.local", "Smoke Test APK", "1.0.0-rc3"),
    ("pham.thi.d@demo.local", "Dashboard UI Kit", "4.0"),
    ("pham.thi.d@demo.local", "Brand Guidelines 2026", "2.0"),
    ("hoang.van.e@demo.local", "Docker Compose Stack", "1.1"),
    ("hoang.van.e@demo.local", "Server Agent Linux", "2.3.0"),
    ("tran.thi.b@demo.local", "RMS Mobile Android 2.1.0", "2.1.0"),
    ("le.van.c@demo.local", "HR Portal Windows", "1.4.2"),
]

_BOOKMARKS = [
    (_DEFAULT_ADMIN_EMAIL, "Security Policy Draft", "0.9", "Cần duyệt trước khi publish"),
    (_DEFAULT_ADMIN_EMAIL, "Executive Summary Q2", "2026.2", None),
    ("nguyen.van.a@demo.local", "Internal API Spec", "3.0", "Tham khảo khi review API"),
    ("tran.thi.b@demo.local", "Auth Service Build", "1.8.0", "Chờ duyệt deploy"),
    ("le.van.c@demo.local", "UAT Test Report April", "1.0", None),
    ("pham.thi.d@demo.local", "Onboarding Screens Mockup", "1.0", "Cần cập nhật màu brand"),
    ("hoang.van.e@demo.local", "K8s Manifests Staging", "0.8", "Deploy tuần sau"),
    ("nguyen.van.a@demo.local", "Sprint Demo Recording", "S24", None),
    ("tran.thi.b@demo.local", "Windows Hotfix KB-1042", "1.0.1", "Hotfix khẩn"),
    ("le.van.c@demo.local", "Mobile Beta Feedback Pack", "1.0", None),
]


def _cfg(name: str, default: str = "") -> str:
    try:
        return str(decouple.config(name, default=default)).strip()
    except Exception:
        return os.environ.get(name, default).strip()


def _enabled() -> bool:
    raw = _cfg("SEED_DEMO_DATA", "")
    if raw.lower() in ("false", "0", "no", "off"):
        return False
    if raw.lower() in ("true", "1", "yes", "on"):
        return True
    return _cfg("ENV", "DEV").upper() in ("DEV", "DEVELOPMENT", "LOCAL")


def _admin_emails() -> list[str]:
    emails: list[str] = []
    for key in ("BOOTSTRAP_ADMIN_EMAIL", "BOOTSTRAP_ADMIN_EMAILS"):
        raw = _cfg(key)
        if not raw:
            continue
        for part in raw.split(","):
            email = part.strip()
            if email and "@" in email and email not in emails:
                emails.append(email)
    if _DEFAULT_ADMIN_EMAIL not in emails:
        emails.append(_DEFAULT_ADMIN_EMAIL)
    return emails


def _uid(key: str) -> uuid.UUID:
    return uuid.uuid5(_NS, f"rms-demo-{key}")


def _lookup_id(conn, table: str, name: str) -> uuid.UUID | None:
    row = conn.execute(
        text(f"SELECT id FROM {table} WHERE name = :name AND is_deleted = false LIMIT 1"),
        {"name": name},
    ).fetchone()
    return row[0] if row else None


def _resource_key(name: str, version: str) -> str:
    return f"{name}::{version}"


def _days_ago_ts(days: int) -> datetime:
    base = datetime.now().replace(microsecond=0)
    hour = random.randint(8, 18)
    minute = random.randint(0, 59)
    return (base - timedelta(days=days)).replace(hour=hour, minute=minute, second=0)


def _get_s3() -> S3Storage | None:
    host = _cfg("AWS_HOST")
    key = _cfg("AWS_ACCESS_KEY_ID")
    secret = _cfg("AWS_SECRET_ACCESS_KEY")
    bucket = _cfg("AWS_BUCKET_NAME")
    if not all([host, key, secret, bucket]):
        print("  warn: thiếu cấu hình S3 — chỉ ghi file local")
        return None
    try:
        return S3Storage(host, key, secret, bucket, _cfg("AWS_REGION", "ap-southeast-1"))
    except Exception as exc:
        print(f"  warn: không kết nối S3: {exc}")
        return None


def _lookup_user_id(conn, email: str) -> uuid.UUID | None:
    row = conn.execute(
        text("SELECT id FROM users WHERE email = :email AND is_deleted = false LIMIT 1"),
        {"email": email},
    ).fetchone()
    return row[0] if row else None


def _ensure_user(
    conn,
    email: str,
    name: str,
    password_hash: str | None,
    created_days_ago: int,
) -> uuid.UUID | None:
    existing = _lookup_user_id(conn, email)
    if existing:
        return existing
    if not password_hash:
        return None
    uid = _uid(f"user-{email}")
    created = _days_ago_ts(created_days_ago)
    conn.execute(
        text(
            """
            INSERT INTO users (id, email, name, password, created_at, updated_at, is_deleted, is_locked)
            VALUES (:id, :email, :name, :password, :created_at, :updated_at, false, false)
            """
        ),
        {
            "id": uid,
            "email": email,
            "name": name,
            "password": password_hash,
            "created_at": created,
            "updated_at": created,
        },
    )
    print(f"  + user: {name} ({email})")
    return uid


def _ensure_all_users(conn, demo_password_hash: str) -> dict[str, uuid.UUID]:
    user_ids: dict[str, uuid.UUID] = {}
    admin_password = _cfg("BOOTSTRAP_ADMIN_PASSWORD")
    admin_hash = get_password_hash(admin_password) if admin_password else None
    admin_name = _cfg("BOOTSTRAP_ADMIN_NAME", "Admin")

    for idx, email in enumerate(_admin_emails()):
        uid = _ensure_user(conn, email, admin_name if email == _admin_emails()[0] else admin_name, admin_hash, 95 - idx)
        if uid:
            user_ids[email] = uid

    for email, name in _DEMO_USERS:
        uid = _ensure_user(
            conn,
            email,
            name,
            demo_password_hash,
            90 - _DEMO_USERS.index((email, name)) * 5,
        )
        if uid:
            user_ids[email] = uid

    return user_ids


def _ensure_repos(conn, user_ids: dict[str, uuid.UUID]) -> dict[str, list[uuid.UUID]]:
    repo_ids: dict[str, list[uuid.UUID]] = {}
    for email, names in _REPOS.items():
        if email not in user_ids:
            continue
        repo_ids[email] = []
        for idx, repo_name in enumerate(names):
            rid = _uid(f"repo-{email}-{idx}")
            exists = conn.execute(
                text("SELECT id FROM package_repos WHERE user_id = :uid AND name = :name LIMIT 1"),
                {"uid": user_ids[email], "name": repo_name},
            ).fetchone()
            if exists:
                repo_ids[email].append(exists[0])
                continue
            ts = _days_ago_ts(85 - idx * 10)
            conn.execute(
                text(
                    """
                    INSERT INTO package_repos (id, user_id, name, created_at, updated_at, is_deleted)
                    VALUES (:id, :user_id, :name, :created_at, :updated_at, false)
                    """
                ),
                {"id": rid, "user_id": user_ids[email], "name": repo_name, "created_at": ts, "updated_at": ts},
            )
            repo_ids[email].append(rid)
    return repo_ids


def _ensure_tags(conn, user_ids: dict[str, uuid.UUID]) -> dict[str, list[uuid.UUID]]:
    tag_ids: dict[str, list[uuid.UUID]] = {}
    for email, names in _TAGS.items():
        if email not in user_ids:
            continue
        tag_ids[email] = []
        for idx, tag_name in enumerate(names):
            tid = _uid(f"tag-{email}-{idx}")
            exists = conn.execute(
                text("SELECT id FROM resource_tags WHERE user_id = :uid AND name = :name LIMIT 1"),
                {"uid": user_ids[email], "name": tag_name},
            ).fetchone()
            if exists:
                tag_ids[email].append(exists[0])
                continue
            ts = _days_ago_ts(80 - idx * 8)
            conn.execute(
                text(
                    """
                    INSERT INTO resource_tags (id, user_id, name, created_at, updated_at, is_deleted)
                    VALUES (:id, :user_id, :name, :created_at, :updated_at, false)
                    """
                ),
                {"id": tid, "user_id": user_ids[email], "name": tag_name, "created_at": ts, "updated_at": ts},
            )
            tag_ids[email].append(tid)
    return tag_ids


def _ensure_resources(
    conn,
    s3: S3Storage | None,
    user_ids: dict[str, uuid.UUID],
    repo_ids: dict[str, list[uuid.UUID]],
    tag_ids: dict[str, list[uuid.UUID]],
    catalog: dict[str, dict[str, uuid.UUID]],
) -> dict[str, uuid.UUID]:
    resource_ids: dict[str, uuid.UUID] = {}
    for row in _RESOURCES:
        name, version, stage, platform, ptype, status, ext, owner, days_ago, repo_idx, tag_idx = row
        if owner not in user_ids or owner not in repo_ids or owner not in tag_ids:
            continue
        key = _resource_key(name, version)
        rid = _uid(f"resource-{key}")
        exists = conn.execute(
            text("SELECT id, url FROM resources WHERE name = :name AND version = :version LIMIT 1"),
            {"name": name, "version": version},
        ).fetchone()
        if exists:
            resource_ids[key] = exists[0]
            url = ensure_resource_file(s3, exists[1] or "", name, version, ext)
            if url != (exists[1] or ""):
                conn.execute(text("UPDATE resources SET url = :url WHERE id = :id"), {"url": url, "id": exists[0]})
            continue

        created = _days_ago_ts(days_ago)
        url, _ = resource_storage_paths(name, version, ext)
        url = ensure_resource_file(s3, url, name, version, ext)
        download_count = random.randint(3, 45) if status == "Approved" else random.randint(0, 3)

        conn.execute(
            text(
                """
                INSERT INTO resources (
                    id, name, version, stage_id, status_id, platform_id,
                    product_type_id, repo_id, user_id, created_at, is_deleted,
                    url, download_count
                ) VALUES (
                    :id, :name, :version, :stage_id, :status_id, :platform_id,
                    :product_type_id, :repo_id, :user_id, :created_at, false,
                    :url, 0
                )
                """
            ),
            {
                "id": rid,
                "name": name,
                "version": version,
                "stage_id": catalog["stages"][stage],
                "status_id": catalog["statuses"][status],
                "platform_id": catalog["platforms"][platform],
                "product_type_id": catalog["product_types"][ptype],
                "repo_id": repo_ids[owner][repo_idx],
                "user_id": user_ids[owner],
                "created_at": created,
                "url": url,
            },
        )

        tag_id = tag_ids[owner][tag_idx]
        conn.execute(
            text(
                """
                INSERT INTO resource_has_resource_tags (resource_id, resource_tag_id, is_deleted)
                VALUES (:resource_id, :tag_id, false)
                """
            ),
            {"resource_id": rid, "tag_id": tag_id},
        )

        resource_ids[key] = rid
        _seed_downloads(conn, rid, user_ids, download_count, created)
        conn.execute(
            text("UPDATE resources SET download_count = :cnt WHERE id = :id"),
            {"cnt": download_count, "id": rid},
        )
        print(f"  + resource: {name} v{version} ({status}) [{owner}]")

    return resource_ids


def _backfill_all_files(conn, s3: S3Storage | None) -> int:
    rows = conn.execute(
        text(
            """
            SELECT name, version, url
            FROM resources
            WHERE is_deleted = false AND url IS NOT NULL AND url <> ''
            """
        )
    ).fetchall()
    fixed = 0
    for name, version, url in rows:
        ext = (url.rsplit(".", 1)[-1].lower() if url and "." in url else "txt")
        canonical_url, canonical_key = resource_storage_paths(name, version, ext)
        needs_file = not (
            local_file_exists(canonical_key)
            and (s3 is None or s3_object_exists(s3, canonical_key))
        )
        needs_url_update = url != canonical_url
        if not needs_file and not needs_url_update:
            continue
        ensure_resource_file(s3, canonical_url, name, version, ext)
        if needs_url_update:
            conn.execute(
                text("UPDATE resources SET url = :url WHERE name = :name AND version = :version"),
                {"url": canonical_url, "name": name, "version": version},
            )
        fixed += 1
        print(f"  + file backfill: {canonical_key}")
    return fixed


def _seed_downloads(
    conn,
    resource_id: uuid.UUID,
    user_ids: dict[str, uuid.UUID],
    count: int,
    since: datetime,
) -> None:
    if count <= 0:
        return
    all_users = list(user_ids.values())
    for i in range(count):
        dl_id = _uid(f"dl-{resource_id}-{i}")
        dl_user = random.choice(all_users)
        offset_days = random.randint(0, max(1, (datetime.now() - since).days))
        dl_at = since + timedelta(days=offset_days, hours=random.randint(0, 10))
        exists = conn.execute(
            text("SELECT 1 FROM download_logs WHERE id = :id"),
            {"id": dl_id},
        ).fetchone()
        if exists:
            continue
        conn.execute(
            text(
                """
                INSERT INTO download_logs (id, resource_id, user_id, downloaded_at)
                VALUES (:id, :resource_id, :user_id, :downloaded_at)
                """
            ),
            {"id": dl_id, "resource_id": resource_id, "user_id": dl_user, "downloaded_at": dl_at},
        )


def _ensure_shares(conn, user_ids: dict[str, uuid.UUID], resource_ids: dict[str, uuid.UUID]) -> None:
    for name, version, shared_email, can_edit in _SHARES:
        if shared_email not in user_ids:
            continue
        key = _resource_key(name, version)
        res_id = resource_ids.get(key)
        if not res_id:
            continue
        sid = _uid(f"share-{key}-{shared_email}")
        exists = conn.execute(text("SELECT 1 FROM resource_shares WHERE id = :id"), {"id": sid}).fetchone()
        if exists:
            continue
        conn.execute(
            text(
                """
                INSERT INTO resource_shares (id, resource_id, shared_with_user_id, can_edit, created_at)
                VALUES (:id, :resource_id, :user_id, :can_edit, :created_at)
                """
            ),
            {
                "id": sid,
                "resource_id": res_id,
                "user_id": user_ids[shared_email],
                "can_edit": can_edit,
                "created_at": _days_ago_ts(random.randint(2, 20)),
            },
        )


def _ensure_favorites(conn, user_ids: dict[str, uuid.UUID], resource_ids: dict[str, uuid.UUID]) -> None:
    for email, name, version in _FAVORITES:
        if email not in user_ids:
            continue
        key = _resource_key(name, version)
        res_id = resource_ids.get(key)
        if not res_id:
            continue
        fid = _uid(f"fav-{email}-{key}")
        exists = conn.execute(text("SELECT 1 FROM user_favorites WHERE id = :id"), {"id": fid}).fetchone()
        if exists:
            continue
        conn.execute(
            text(
                """
                INSERT INTO user_favorites (id, user_id, resource_id, created_at)
                VALUES (:id, :user_id, :resource_id, :created_at)
                """
            ),
            {
                "id": fid,
                "user_id": user_ids[email],
                "resource_id": res_id,
                "created_at": _days_ago_ts(random.randint(1, 30)),
            },
        )


def _ensure_bookmarks(conn, user_ids: dict[str, uuid.UUID], resource_ids: dict[str, uuid.UUID]) -> None:
    for email, name, version, note in _BOOKMARKS:
        if email not in user_ids:
            continue
        key = _resource_key(name, version)
        res_id = resource_ids.get(key)
        if not res_id:
            continue
        bid = _uid(f"bm-{email}-{key}")
        exists = conn.execute(text("SELECT 1 FROM user_bookmarks WHERE id = :id"), {"id": bid}).fetchone()
        if exists:
            continue
        conn.execute(
            text(
                """
                INSERT INTO user_bookmarks (id, user_id, resource_id, note, created_at)
                VALUES (:id, :user_id, :resource_id, :note, :created_at)
                """
            ),
            {
                "id": bid,
                "user_id": user_ids[email],
                "resource_id": res_id,
                "note": note,
                "created_at": _days_ago_ts(random.randint(1, 25)),
            },
        )


def _ensure_search_history(conn, user_ids: dict[str, uuid.UUID]) -> None:
    emails = list(user_ids.keys())
    for idx, (query, res_cnt, usr_cnt) in enumerate(_SEARCH_QUERIES):
        email = emails[idx % len(emails)]
        qkey = query.lower().strip()
        sid = _uid(f"search-{email}-{qkey}")
        exists = conn.execute(text("SELECT 1 FROM search_history WHERE id = :id"), {"id": sid}).fetchone()
        if exists:
            continue
        conn.execute(
            text(
                """
                INSERT INTO search_history (id, user_id, query, query_key, resource_count, user_count, searched_at)
                VALUES (:id, :user_id, :query, :query_key, :resource_count, :user_count, :searched_at)
                """
            ),
            {
                "id": sid,
                "user_id": user_ids[email],
                "query": query,
                "query_key": qkey,
                "resource_count": res_cnt,
                "user_count": usr_cnt,
                "searched_at": _days_ago_ts(random.randint(1, 45)),
            },
        )


def _ensure_notifications(conn, user_ids: dict[str, uuid.UUID]) -> None:
    notifs = [
        (_DEFAULT_ADMIN_EMAIL, "Chào mừng quản trị viên", "Dữ liệu demo đã sẵn sàng — 10+ tài nguyên thuộc tài khoản của bạn.", "system", False, 0),
        (_DEFAULT_ADMIN_EMAIL, "Tài nguyên chờ duyệt", "Security Policy Draft v0.9 đang chờ phê duyệt.", "review", False, 1),
        (_DEFAULT_ADMIN_EMAIL, "Phát hành mới", "RMS Mobile Release APK v3.0.0 đã được phê duyệt.", "resource", True, 2),
        ("nguyen.van.a@demo.local", "Phiên bản mới đã phê duyệt", "RMS Mobile Android v2.1.0 đã sẵn sàng phát hành.", "resource", True, 5),
        ("tran.thi.b@demo.local", "Tài nguyên được chia sẻ", "Admin đã chia sẻ RMS Mobile Android v2.1.0 với bạn.", "share", False, 3),
        ("le.van.c@demo.local", "Chờ kiểm duyệt", "Smoke Test APK v1.0.0-rc3 đang chờ phê duyệt.", "review", False, 2),
        ("pham.thi.d@demo.local", "Tải xuống thành công", "Promo Video Launch đã được tải 12 lần tuần này.", "download", True, 8),
        ("hoang.van.e@demo.local", "Cập nhật hệ thống", "Docker Compose Stack v1.1 đã deploy lên staging.", "system", True, 12),
    ]
    for idx, item in enumerate(notifs):
        email, title, message, ntype, is_read, days_ago = item
        target = user_ids.get(email)
        if not target:
            continue
        nid = _uid(f"notif-{email}-{idx}")
        exists = conn.execute(text("SELECT 1 FROM notifications WHERE id = :id"), {"id": nid}).fetchone()
        if exists:
            continue
        conn.execute(
            text(
                """
                INSERT INTO notifications (
                    id, user_id, title, message, type, source, is_read, created_at, is_deleted
                ) VALUES (:id, :user_id, :title, :message, :type, 'seed', :is_read, :created_at, false)
                """
            ),
            {
                "id": nid,
                "user_id": target,
                "title": title,
                "message": message,
                "type": ntype,
                "is_read": is_read,
                "created_at": _days_ago_ts(days_ago),
            },
        )


def _load_catalog(conn) -> dict[str, dict[str, uuid.UUID]] | None:
    stages: dict[str, uuid.UUID] = {}
    platforms: dict[str, uuid.UUID] = {}
    product_types: dict[str, uuid.UUID] = {}
    statuses: dict[str, uuid.UUID] = {}
    for stage in ("Development", "Staging", "Production"):
        sid = _lookup_id(conn, "resource_stages", stage)
        if sid:
            stages[stage] = sid
    for platform in ("Android", "Windows", "Linux", "macOS", "Web"):
        pid = _lookup_id(conn, "resource_platforms", platform)
        if pid:
            platforms[platform] = pid
    for ptype in ("Mobile App", "Desktop Software", "Document", "Archive", "Media"):
        tid = _lookup_id(conn, "product_types", ptype)
        if tid:
            product_types[ptype] = tid
    for status in ("Pending", "Approved", "Rejected"):
        sid = _lookup_id(conn, "resource_statuss", status)
        if sid:
            statuses[status] = sid
    if not all([stages, platforms, product_types, statuses]):
        return None
    return {
        "stages": stages,
        "platforms": platforms,
        "product_types": product_types,
        "statuses": statuses,
    }


def main() -> None:
    if not _enabled():
        print("Skip demo seed: SEED_DEMO_DATA is disabled.")
        return

    random.seed(42)
    s3 = _get_s3()

    with engine.begin() as conn:
        catalog = _load_catalog(conn)
        if not catalog:
            print("Skip demo seed: catalog chưa đủ (chạy migration + seed_classification_defaults trước).")
            return

        demo_password = _cfg("SEED_DEMO_PASSWORD", _DEMO_PASSWORD_DEFAULT)
        demo_password_hash = get_password_hash(demo_password)

        full_seed = conn.execute(
            text("SELECT 1 FROM users WHERE email = :email LIMIT 1"),
            {"email": _MARKER_EMAIL},
        ).fetchone() is None

        if full_seed:
            print("Seeding demo data (mô phỏng ~3 tháng vận hành + file thật)...")
        else:
            print("Demo users đã có — bổ sung admin + backfill file...")

        user_ids = _ensure_all_users(conn, demo_password_hash)
        repo_ids = _ensure_repos(conn, user_ids)
        tag_ids = _ensure_tags(conn, user_ids)
        resource_ids = _ensure_resources(conn, s3, user_ids, repo_ids, tag_ids, catalog)

        if full_seed:
            _ensure_shares(conn, user_ids, resource_ids)
            _ensure_favorites(conn, user_ids, resource_ids)
            _ensure_bookmarks(conn, user_ids, resource_ids)
            _ensure_search_history(conn, user_ids)
        _ensure_notifications(conn, user_ids)

        fixed = _backfill_all_files(conn, s3)
        if fixed:
            print(f"  Backfilled {fixed} file(s).")

    print("Demo seed OK.")
    admins = ", ".join(_admin_emails())
    print(f"  Admin seed: {admins}")
    print(f"  Demo users password: {_cfg('SEED_DEMO_PASSWORD', _DEMO_PASSWORD_DEFAULT)}")


if __name__ == "__main__":
    main()

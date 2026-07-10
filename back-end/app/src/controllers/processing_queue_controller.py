"""API theo dõi hàng đợi phân loại tự động."""
from typing import Tuple

from fastapi import APIRouter, Depends, Query

from app.src.controllers.auth_controller import user_service
from app.src.models import User
from app.src.schemas.response import ResponseObject
from app.src.services.classification_queue import get_job, list_user_jobs, queue_stats
from app.src.exceptions.error_code import BEErrorCode

processing_queue_routers = APIRouter()


@processing_queue_routers.get("/processing_queue")
def list_processing_queue(
    limit: int = Query(50, ge=1, le=200),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Danh sách job classification của user hiện tại."""
    jobs = list_user_jobs(str(user[0].id), limit=limit)
    stats = queue_stats(str(user[0].id))
    return ResponseObject(data={"items": jobs, "stats": stats}, code="BE0000")


@processing_queue_routers.get("/processing_queue/stats")
def processing_queue_stats(
    user: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Thống kê nhanh cho UI /uploads/queue."""
    return ResponseObject(data=queue_stats(str(user[0].id)), code="BE0000")


@processing_queue_routers.get("/processing_queue/{job_id}")
def get_processing_job(
    job_id: str,
    user: Tuple[User, str] = Depends(user_service.get_current_user),
):
    job = get_job(job_id)
    if not job or str(job.get("user_id")) != str(user[0].id):
        raise BEErrorCode.RESOURCE_NOT_FOUND.value
    return ResponseObject(data=job, code="BE0000")

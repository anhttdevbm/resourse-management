"""Statistics controller."""
from typing import Tuple

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.src.models import User
from app.src.schemas.response import ResponseObject
from app.src.services.statistics_service import StatisticsService
from app.src.services.user_service import UserService
from app.src.utils.connection.sql_connection import get_db_session

statistics_routers = APIRouter()
statistics_service = StatisticsService()
user_service = UserService()


@statistics_routers.get("/statistics", response_model=ResponseObject)
def get_statistics(
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Get system statistics (authenticated)."""
    try:
        statistics = statistics_service.get_statistics(db_session)
        return ResponseObject(data=statistics, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/recent-activities", response_model=ResponseObject)
def get_recent_activities(
    limit: int = Query(default=10, ge=1, le=500),
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Get recent activities."""
    try:
        activities = statistics_service.get_recent_activities(db_session, limit)
        return ResponseObject(data=activities, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/file-types", response_model=ResponseObject)
def get_file_type_statistics(
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Get file type statistics."""
    try:
        file_types = statistics_service.get_file_type_statistics(db_session)
        return ResponseObject(data=file_types, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/top-downloads", response_model=ResponseObject)
def get_top_downloaded_resources(
    limit: int = Query(default=10, ge=1, le=50),
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Get top downloaded resources."""
    try:
        top_resources = statistics_service.get_top_downloaded_resources(db_session, limit)
        return ResponseObject(data=top_resources, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/storage-usage", response_model=ResponseObject)
def get_storage_usage(
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Get storage usage statistics."""
    try:
        storage_data = statistics_service.get_storage_usage(db_session)
        return ResponseObject(data=storage_data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/security", response_model=ResponseObject)
def get_security_statistics(
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Get security scanning statistics."""
    try:
        security_data = statistics_service.get_security_statistics(db_session)
        return ResponseObject(data=security_data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/downloads", response_model=ResponseObject)
def get_download_statistics(
    period: str = Query(default="7d", regex="^(1d|7d|30d|90d|1y)$"),
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Get download statistics for a specific period."""
    try:
        download_stats = statistics_service.get_download_statistics(db_session, period)
        return ResponseObject(data=download_stats, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/uploads", response_model=ResponseObject)
def get_upload_statistics(
    period: str = Query(default="7d", pattern="^(1d|7d|30d|90d|1y)$"),
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Upload statistics for a specific period."""
    try:
        data = statistics_service.get_upload_statistics(db_session, period)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/users", response_model=ResponseObject)
def get_user_statistics(
    period: str = Query(default="30d", pattern="^(1d|7d|30d|90d|1y)$"),
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """User registration and activity statistics."""
    try:
        data = statistics_service.get_user_statistics(db_session, period)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/resource-status", response_model=ResponseObject)
def get_resource_status_breakdown(
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Resources grouped by status."""
    try:
        data = statistics_service.get_resource_status_breakdown(db_session)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/platforms", response_model=ResponseObject)
def get_platform_breakdown(
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Resources grouped by platform."""
    try:
        data = statistics_service.get_platform_breakdown(db_session)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/product-types", response_model=ResponseObject)
def get_product_type_breakdown(
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Resources grouped by product type."""
    try:
        data = statistics_service.get_product_type_breakdown(db_session)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/stages", response_model=ResponseObject)
def get_stage_breakdown(
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
):
    """Resources grouped by stage."""
    try:
        data = statistics_service.get_stage_breakdown(db_session)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

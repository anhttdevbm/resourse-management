"""Define system info controller."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.src.models import User
from app.src.schemas.response import ResponseObject
from app.src.schemas.system_info import SystemInfoUpdate
from app.src.services.system_info_service import SystemInfoService
from app.src.utils.connection.sql_connection import get_db_session
from app.src.utils.deps_permissions import require_admin_user

system_info_routers = APIRouter()
system_info_service = SystemInfoService()


def _system_info_dict(system_info) -> dict:
    return {
        "id": str(system_info.id),
        "system_name": system_info.system_name,
        "status": system_info.status,
        "version": system_info.version,
        "created_at": system_info.created_at.isoformat() if system_info.created_at else None,
        "updated_at": system_info.updated_at.isoformat() if system_info.updated_at else None,
    }


@system_info_routers.get("/system-info", response_model=ResponseObject)
def get_system_info(db_session: Session = Depends(get_db_session)):
    """Get system information (public endpoint)."""
    try:
        system_info = system_info_service.get_or_create_system_info(db_session)
        return ResponseObject(data=_system_info_dict(system_info), code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@system_info_routers.put("/system-info", response_model=ResponseObject)
def update_system_info(
    system_info_update: SystemInfoUpdate,
    db_session: Session = Depends(get_db_session),
    _: User = Depends(require_admin_user),
):
    """Update system information (admin only — permission-based)."""
    try:
        system_info = system_info_service.update_system_info(db_session, system_info_update)
        return ResponseObject(
            data=_system_info_dict(system_info),
            code="BE0000",
            message="System info updated successfully",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

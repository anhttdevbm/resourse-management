"""Define system info controller."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.src.services.system_info_service import SystemInfoService
from app.src.services.user_service import UserService
from app.src.schemas.system_info import SystemInfoResponse, SystemInfoUpdate
from app.src.schemas.response import ResponseObject
from app.src.utils.connection.sql_connection import get_db_session
from app.src.models import User
from typing import Tuple

system_info_routers = APIRouter()
system_info_service = SystemInfoService()
user_service = UserService()

def get_current_admin_user(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user)
) -> User:
    """Get current admin user - only admin or AllAccess permission can access."""
    user, _ = current_user
    
    # Check if user has AllAccess permission
    has_all_access = any(permission.name == "AllAccess" for permission in user.permissions)
    
    # Check if user is admin by name (since roles relationship might not be loaded)
    is_admin_by_name = user.name == "Admin"
    
    if not (has_all_access or is_admin_by_name):
        raise HTTPException(status_code=403, detail="Only admin or users with AllAccess permission can access system info")
    
    return user

@system_info_routers.get("/system-info", response_model=ResponseObject)
def get_system_info(db_session: Session = Depends(get_db_session)):
    """Get system information (public endpoint)."""
    try:
        system_info = system_info_service.get_or_create_system_info(db_session)
        print(f"🔍 Controller Debug - System Info: {system_info}")
        print(f"🔍 Controller Debug - System Info type: {type(system_info)}")
        
        # Convert to dict manually to avoid serialization issues
        system_info_dict = {
            "id": str(system_info.id),
            "system_name": system_info.system_name,
            "status": system_info.status,
            "version": system_info.version,
            "created_at": system_info.created_at.isoformat() if system_info.created_at else None,
            "updated_at": system_info.updated_at.isoformat() if system_info.updated_at else None
        }
        
        print(f"🔍 Controller Debug - System Info dict: {system_info_dict}")
        return ResponseObject(data=system_info_dict, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@system_info_routers.put("/system-info", response_model=ResponseObject)
def update_system_info(
    system_info_update: SystemInfoUpdate,
    db_session: Session = Depends(get_db_session),
    admin_user: User = Depends(get_current_admin_user)
):
    """Update system information (admin only)."""
    try:
        system_info = system_info_service.update_system_info(db_session, system_info_update)
        
        # Convert to dict manually
        system_info_dict = {
            "id": str(system_info.id),
            "system_name": system_info.system_name,
            "status": system_info.status,
            "version": system_info.version,
            "created_at": system_info.created_at.isoformat() if system_info.created_at else None,
            "updated_at": system_info.updated_at.isoformat() if system_info.updated_at else None
        }
        
        return ResponseObject(
            data=system_info_dict,
            code="BE0000",
            message="System info updated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""Shared permission dependencies for controllers."""
from typing import Tuple

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.src.models import User
from app.src.services.user_service import UserService
from app.src.utils.connection.sql_connection import get_db_session

user_service = UserService()

MANAGE_RESOURCES_PERMISSION = "manage_resources"
ADMIN_PERMISSION_NAMES = frozenset({"AllAccess", "admin", "Administrator"})


def require_manage_catalog(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> User:
    """Require admin or manage_resources for catalog mutations."""
    user, _ = current_user
    if user_service._has_admin_access(db_session, user):
        return user
    loaded = user_service._user_with_permissions(db_session, user.id)
    if loaded and any(p.name == MANAGE_RESOURCES_PERMISSION for p in (loaded.permissions or [])):
        return user
    raise HTTPException(status_code=403, detail="Insufficient permissions to modify catalog")


def require_admin_user(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> User:
    """Require AllAccess / admin permission (never by display name)."""
    user, _ = current_user
    if not user_service._has_admin_access(db_session, user):
        raise HTTPException(status_code=403, detail="Admin permission required")
    return user

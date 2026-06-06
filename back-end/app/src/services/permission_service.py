"""Define permission file."""
import uuid
from typing import Any, Dict

from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import BEErrorCode
from app.src.repositories.permission import PermissionRepository
from app.src.schemas.permission import PermissionCreate, PermissionUpdate


class PermissionService(object):
    """Define Permission service object."""

    def __init__(self) -> None:
        """Define constructor for Permission service object."""
        self.permission_repository = PermissionRepository(models.Permission)

    def get_permission_by_id(self, db_session: Session, permission_id: uuid.UUID,
                             user_organization) -> models.Permission:
        """Define get permission method."""
        permissions = user_organization.permissions
        kt = 0
        for permission in permissions:
            if permission.name in ["AllAccess", "Permission:Read", "Permission:AllAccess"]:
                kt = 1
                permission = self.permission_repository.get(db_session, obj_id=permission_id)
                if not permission:
                    raise BEErrorCode.PERMISSION_NOT_FOUND.value
                return permission
        if kt == 0:
            raise BEErrorCode.USER_NOT_PERMISSION.value

    def create_permission(self, db_session: Session, permission_create: PermissionCreate,
                          user_organization) -> models.Permission:
        """Define create permission method."""
        permissions = user_organization.permissions
        kt = 0
        for permission in permissions:
            if permission.name in ["AllAccess", "Permission:Create", "Permission:AllAccess"]:
                kt = 1
                if self.permission_repository.get_permission_by_name(db_session, permission_create.name):
                    raise BEErrorCode.PERMISSION_EXITED.value
                permission = self.permission_repository.create(db_session, obj_in=permission_create)
                return permission
        if kt == 0:
            raise BEErrorCode.USER_NOT_PERMISSION.value

    def delete_permission(self, db_session: Session, permission_id: uuid.UUID, user_organization) -> None:
        """Define remove permission method."""
        permissions = user_organization.permissions
        kt = 0
        for permission in permissions:
            if permission.name in ["AllAccess", "Permission:Delete", "Permission:AllAccess"]:
                kt = 1
                permission = self.get_permission_by_id(db_session, permission_id, user_organization)
                if not permission:
                    raise BEErrorCode.PERMISSION_EXITED.value
                self.permission_repository.delete(db_session, obj_id=permission_id)
        if kt == 0:
            raise BEErrorCode.USER_NOT_PERMISSION.value

    def update_permission(self, db_session: Session, permission_id: uuid.UUID, permission_update: PermissionUpdate,
                          user_organization) -> models.Permission:
        """Update an existing permission."""
        permissions = user_organization.permissions
        kt = 0
        for permission in permissions:
            if permission.name in ["AllAccess", "Permission:Update", "Permission:AllAccess"]:
                kt = 1
                if self.get_permission_by_id(db_session, permission_id, user_organization) is None:
                    raise BEErrorCode.PERMISSION_EXITED.value
                permission = self.permission_repository.update(db_session, obj_id=permission_id,
                                                               obj_in=permission_update)
                permission = self.permission_repository.get(db_session, permission_id)
                if not permission:
                    raise BEErrorCode.PERMISSION_NOT_FOUND.value
                return permission
        if kt == 0:
            raise BEErrorCode.USER_NOT_PERMISSION.value

    def get_all_permissions(self, db_session: Session, user_organization) -> Dict[str, Any]:
        """Retrieve all permissions."""
        permissions = user_organization.permissions
        kt = 0
        for permission in permissions:
            if permission.name in ["AllAccess", "Permission:Read", "Permission:AllAccess"]:
                kt = 1
                permissions = self.permission_repository.get_all(db_session)
                if not permissions:
                    raise BEErrorCode.PERMISSION_NOT_FOUND.value
                data = {}
                for permission in permissions:
                    data[str(permission.id)] = permission.__dict__
                return data
        if kt == 0:
            raise BEErrorCode.USER_NOT_PERMISSION.value
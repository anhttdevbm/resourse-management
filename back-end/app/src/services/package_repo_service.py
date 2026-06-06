"""Define package repository service file."""
import uuid
from typing import Any, Dict

from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import BEErrorCode
from app.src.repositories.package_repo import PackageRepositoryRepository
from app.src.schemas.package_repository import PackageRepositoryCreate, PackageRepositoryUpdate


class PackageRepositoryService(object):
    """Define Package Repository service object. Kho được ràng buộc theo từng user."""

    def __init__(self) -> None:
        """Define constructor for Package Repository service object."""
        self.package_repository_repository = PackageRepositoryRepository(models.PackageRepository)

    def get(self, db_session: Session, package_repository_id: uuid.UUID, user_id: uuid.UUID) -> models.PackageRepository:
        """Lấy một Package Repository theo id, chỉ trả về nếu thuộc user."""
        package_repository = self.package_repository_repository.get(db_session, package_repository_id)
        if not package_repository or str(package_repository.user_id) != str(user_id):
            raise BEErrorCode.PACKAGE_REPOSITORY_NOT_FOUND.value
        return package_repository

    def delete(self, db_session: Session, package_repository_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Xóa Package Repository; chỉ cho phép xóa nếu thuộc user."""
        package_repository = self.package_repository_repository.get(db_session, package_repository_id)
        if not package_repository or str(package_repository.user_id) != str(user_id):
            raise BEErrorCode.PACKAGE_REPOSITORY_NOT_FOUND.value
        self.package_repository_repository.delete(db_session, obj_id=package_repository.id)

    def get_all(self, db_session: Session, user_id: uuid.UUID) -> Dict[str, Any]:
        """Lấy tất cả Package Repository của user hiện tại."""
        package_repositories = self.package_repository_repository.get_all_by_user(db_session, user_id)
        data: Dict[str, Any] = {}
        if not package_repositories:
            return data
        for package_repository in package_repositories:
            package_repository_dict = package_repository.__dict__.copy()
            package_repository_dict.pop('_sa_instance_state', None)
            package_repository_dict['id'] = str(package_repository_dict['id'])
            package_repository_dict['name'] = str(package_repository_dict['name'])
            package_repository_dict['created_at'] = package_repository_dict['created_at'].isoformat()
            package_repository_dict['updated_at'] = package_repository_dict['updated_at'].isoformat()
            data[package_repository_dict['id']] = package_repository_dict
        return data

    def update(
        self,
        db_session: Session,
        package_repository_id: int,
        package_repository_update: PackageRepositoryUpdate,
        user_id: uuid.UUID,
    ) -> models.PackageRepository:
        """Cập nhật Package Repository; chỉ cho phép nếu thuộc user."""
        package_repository = self.package_repository_repository.get(db_session, package_repository_id)
        if not package_repository or str(package_repository.user_id) != str(user_id):
            raise BEErrorCode.PACKAGE_REPOSITORY_NOT_FOUND.value
        _ = self.package_repository_repository.update(
            db_session, obj_id=package_repository_id, obj_in=package_repository_update
        )
        package_repository = self.package_repository_repository.get(db_session, package_repository_id)
        if not package_repository:
            raise BEErrorCode.PACKAGE_REPOSITORY_NOT_FOUND.value
        return package_repository

    def create(
        self,
        db_session: Session,
        package_repository_create: PackageRepositoryCreate,
        user_id: uuid.UUID,
    ) -> models.PackageRepository:
        """Tạo kho mới cho user. Tên trùng chỉ kiểm tra trong phạm vi user."""
        package_repository = self.package_repository_repository.get_package_repository_by_name(
            db_session, package_repository_create.name, user_id
        )
        if package_repository:
            raise BEErrorCode.PACKAGE_REPOSITORY_EXITED.value
        obj_in = {"name": package_repository_create.name, "user_id": user_id}
        return self.package_repository_repository.create(db_session, obj_in=obj_in)


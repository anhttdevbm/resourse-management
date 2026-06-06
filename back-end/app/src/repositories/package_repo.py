"""doc."""
from app.src import models
from app.src.repositories.base_sql import BaseSQLRepository
from sqlalchemy.orm import Session
from typing import Any, List, Optional, Union
from app.src.exceptions.error_code import ServerErrorCode
from sqlalchemy.exc import SQLAlchemyError


class PackageRepositoryRepository(BaseSQLRepository[models.PackageRepository]):
    """Define package repository repository."""

    def get_all_by_user(self, session: Session, user_id: Any) -> List[models.PackageRepository]:
        """Lấy tất cả kho của một user."""
        try:
            return session.query(self.model).filter(
                self.model.user_id == user_id,
                self.model.is_deleted.is_(False),
            ).all()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)

    def get_package_repository_by_name(
        self, session: Session, value: Any, user_id: Any
    ) -> Union[Optional[models.PackageRepository]]:
        """Lấy kho theo tên và user (trùng tên chỉ trong phạm vi user)."""
        try:
            obj = session.query(self.model).filter(
                self.model.name == value,
                self.model.user_id == user_id,
                self.model.is_deleted.is_(False),
            ).first()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        return obj
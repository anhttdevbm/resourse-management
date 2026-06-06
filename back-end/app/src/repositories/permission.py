"""doc."""
from typing import Any, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import ServerErrorCode
from app.src.repositories.base_sql import BaseSQLRepository


class PermissionRepository(BaseSQLRepository[models.Permission]):
    """Define Permission repository."""

    def get_permission_by_name(self, session: Session, value: Any) -> Optional[models.Permission]:
        """Define method get permission by name."""
        try:
            obj = session.query(self.model).filter(self.model.name == value,
                                                   self.model.is_deleted.is_(False)).first()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        return obj
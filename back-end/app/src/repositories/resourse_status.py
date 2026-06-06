"""doc."""
from typing import Any, Optional, Union
from sqlalchemy.orm import Session
from app.src import models
from app.src.repositories.base_sql import BaseSQLRepository
from app.src.exceptions.error_code import ServerErrorCode
from sqlalchemy.exc import SQLAlchemyError

class ResourceStatusRepository(BaseSQLRepository[models.ResourceStatus]):
    """Define Resource Status repository."""

    def get_resource_status_by_name(self, session: Session, value: Any) -> Union[Optional[models.ResourceStatus]]:
        """Define method get resource status by name."""
        try:
            obj = session.query(self.model).filter(self.model.name == value,
                                                   self.model.is_deleted.is_(False)).first()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        return obj

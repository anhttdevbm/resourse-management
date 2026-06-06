"""doc."""
from app.src import models
from app.src.repositories.base_sql import BaseSQLRepository
from sqlalchemy.orm import Session
from typing import Any, Optional, Union
from app.src.exceptions.error_code import ServerErrorCode
from sqlalchemy.exc import SQLAlchemyError

class ResourcePlatformRepository(BaseSQLRepository[models.ResourcePlatform]):
    """Define resource flatform repository."""
    def get_resource_form_by_name(self, session: Session, value: Any) -> Union[Optional[models.ResourcePlatform]]:
        """Define method get resource flatform by name."""
        try:
            obj = session.query(self.model).filter(self.model.name == value,
                                                   self.model.is_deleted.is_(False)).first()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        return obj
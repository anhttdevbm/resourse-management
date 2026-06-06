"""Repository cho auto_classification_rules."""
import uuid
from typing import List

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import ServerErrorCode
from app.src.repositories.base_sql import BaseSQLRepository


class AutoClassificationRuleRepository(BaseSQLRepository[models.AutoClassificationRule]):
    """CRUD + list theo user."""

    def get_all_by_user(self, session: Session, user_id: uuid.UUID) -> List[models.AutoClassificationRule]:
        """Quy tắc chưa xóa của user, sort_order tăng dần."""
        try:
            return (
                session.query(self.model)
                .filter(self.model.user_id == user_id, self.model.is_deleted.is_(False))
                .order_by(self.model.sort_order.asc(), self.model.created_at.asc())
                .all()
            )
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)

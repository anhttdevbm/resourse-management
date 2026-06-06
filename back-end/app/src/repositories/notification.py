"""Repository for notification entities."""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.src import models
from app.src.repositories.base_sql import BaseSQLRepository


class NotificationRepository(BaseSQLRepository[models.Notification]):
    """Provide helpers scoped to notifications."""

    def get_user_notifications(
        self,
        session: Session,
        user_id: UUID,
        limit: int,
        offset: int,
    ) -> List[models.Notification]:
        return (
            session.query(self.model)
            .filter(
                self.model.user_id == user_id,
                self.model.is_deleted.is_(False),
            )
            .order_by(self.model.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

    def count_user_notifications(self, session: Session, user_id: UUID) -> int:
        return (
            session.query(func.count(self.model.id))
            .filter(
                self.model.user_id == user_id,
                self.model.is_deleted.is_(False),
            )
            .scalar()
            or 0
        )

    def count_unread(self, session: Session, user_id: UUID) -> int:
        return (
            session.query(func.count(self.model.id))
            .filter(
                self.model.user_id == user_id,
                self.model.is_read.is_(False),
                self.model.is_deleted.is_(False),
            )
            .scalar()
            or 0
        )

    def get_by_id_and_user(
        self,
        session: Session,
        notification_id: UUID,
        user_id: UUID,
    ) -> Optional[models.Notification]:
        return (
            session.query(self.model)
            .filter(
                self.model.id == notification_id,
                self.model.user_id == user_id,
                self.model.is_deleted.is_(False),
            )
            .first()
        )


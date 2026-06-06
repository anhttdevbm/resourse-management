"""Notification service layer."""
from __future__ import annotations

from datetime import datetime
from typing import Iterable, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import BEErrorCode
from app.src.repositories.notification import NotificationRepository
from app.src.schemas.notification import (
    NotificationCreate,
    NotificationItem,
    NotificationPage,
)
from app.src.utils.notification_channel import publish_notification_event


class NotificationService:
    """Business logic for notifications."""

    def __init__(self) -> None:
        self.repository = NotificationRepository(models.Notification)

    def _serialize(self, notification: models.Notification) -> NotificationItem:
        return NotificationItem(
            id=notification.id,
            user_id=notification.user_id,
            title=notification.title,
            message=notification.message,
            type=notification.type,
            source=notification.source,
            payload=notification.payload,
            link=notification.link,
            is_read=notification.is_read,
            created_at=notification.created_at,
            read_at=notification.read_at,
            expires_at=notification.expires_at,
        )

    def _extract_targets(
        self,
        payload: NotificationCreate,
        fallback_user_id: UUID,
    ) -> List[UUID]:
        targets: List[UUID] = []
        if payload.user_id:
            targets.append(payload.user_id)
        if payload.user_ids:
            targets.extend(payload.user_ids)
        if not targets:
            targets.append(fallback_user_id)
        # remove duplicates while keeping order
        seen = set()
        unique: List[UUID] = []
        for user_id in targets:
            if user_id not in seen:
                unique.append(user_id)
                seen.add(user_id)
        return unique

    def create_notifications(
        self,
        session: Session,
        creator_id: UUID,
        payload: NotificationCreate,
    ) -> List[NotificationItem]:
        targets = self._extract_targets(payload, creator_id)
        created: List[NotificationItem] = []
        for user_id in targets:
            create_data = payload.dict(
                exclude={"user_id", "user_ids"},
            )
            create_data["user_id"] = user_id
            notification = self.repository.create(session, obj_in=create_data)
            serialized = self._serialize(notification)
            created.append(serialized)
            publish_notification_event(str(user_id), serialized.dict())
        return created

    def get_user_notifications(
        self,
        session: Session,
        user_id: UUID,
        page: int,
        page_size: int,
    ) -> NotificationPage:
        offset = (page - 1) * page_size
        records = self.repository.get_user_notifications(session, user_id, page_size, offset)
        total = self.repository.count_user_notifications(session, user_id)
        unread = self.repository.count_unread(session, user_id)
        items = [self._serialize(record) for record in records]
        return NotificationPage(
            items=items,
            total=total,
            unread=unread,
            page=page,
            page_size=page_size,
        )

    def mark_notification_read(
        self,
        session: Session,
        notification_id: UUID,
        user_id: UUID,
    ) -> NotificationItem:
        notification = self.repository.get_by_id_and_user(session, notification_id, user_id)
        if not notification:
            raise BEErrorCode.NOTIFICATION_NOT_FOUND.value
        if not notification.is_read:
            self.repository.update(
                session,
                obj_id=notification.id,
                obj_in={"is_read": True, "read_at": datetime.utcnow()},
            )
            session.refresh(notification)
        return self._serialize(notification)

    def mark_all_read(
        self,
        session: Session,
        user_id: UUID,
    ) -> int:
        updated = (
            session.query(models.Notification)
            .filter(
                models.Notification.user_id == user_id,
                models.Notification.is_read.is_(False),
                models.Notification.is_deleted.is_(False),
            )
            .update({"is_read": True, "read_at": datetime.utcnow()})
        )
        session.commit()
        return updated or 0


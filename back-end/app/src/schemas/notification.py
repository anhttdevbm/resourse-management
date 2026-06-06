"""Notification schemas."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class NotificationBase(BaseModel):
    """Shared attributes."""

    title: str = Field(..., max_length=255)
    message: str
    type: str = Field(default="system", max_length=50)
    source: str = Field(default="system", max_length=50)
    payload: Optional[dict] = None
    link: Optional[str] = Field(default=None, max_length=512)
    expires_at: Optional[datetime] = None


class NotificationCreate(NotificationBase):
    """Payload to create notifications."""

    user_id: Optional[UUID] = Field(default=None, description="Single target user.")
    user_ids: Optional[List[UUID]] = Field(default=None, description="Multiple target users.")


class NotificationItem(NotificationBase):
    """Response representation."""

    id: UUID
    user_id: UUID
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationPage(BaseModel):
    """Paginated notification list."""

    items: List[NotificationItem]
    total: int
    unread: int
    page: int
    page_size: int


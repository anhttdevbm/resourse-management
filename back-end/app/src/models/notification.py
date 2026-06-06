"""Notification model."""
import uuid
from typing import Optional

from sqlalchemy import BOOLEAN, TIMESTAMP, UUID, Column, ForeignKey, String, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.src.utils.common import generate_uuid
from .base_model import Base


class Notification(Base):
    """Represent a user notification stored for long term."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="system", nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="system", nullable=False)
    payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    link: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_read: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    read_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    expires_at = Column(TIMESTAMP, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)

    user = relationship("User", back_populates="notifications")


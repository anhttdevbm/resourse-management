"""Define resource share model."""
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import BOOLEAN, TIMESTAMP, UUID, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.src.utils.common import generate_uuid
from .base_model import Base


if TYPE_CHECKING:  # only for type checkers
    from .resource import Resource
    from .user import User


class ResourceShare(Base):
    """Define resource share model (chia sẻ tài nguyên cho user khác)."""

    __tablename__ = "resource_shares"
    __table_args__ = (
        UniqueConstraint("resource_id", "shared_with_user_id", name="uq_resource_shares_resource_user"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resources.id"), nullable=False
    )
    shared_with_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    can_edit: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    created_at: Mapped[TIMESTAMP] = mapped_column(
        TIMESTAMP, server_default=func.now(), nullable=False
    )

    # relationships
    resource: Mapped["Resource"] = relationship("Resource", back_populates="shares")
    shared_with: Mapped["User"] = relationship("User", back_populates="shared_resources")


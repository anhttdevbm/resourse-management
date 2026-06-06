"""Define resource tag model."""
import uuid
from sqlalchemy import BOOLEAN, TIMESTAMP, UUID, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.src.utils.common import generate_uuid
from .resource import Resource
from .base_model import Base
from .resource_has_resource_tag import resource_resource_tag


class ResourceTag(Base):
    """Define resource tag model. Mỗi user có danh sách thẻ riêng."""

    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_resource_tags_user_name"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)  # noqa
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[TIMESTAMP] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at: Mapped[TIMESTAMP] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    is_deleted: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    resources = relationship("Resource", secondary=resource_resource_tag, back_populates="resource_tags")

    class Config:
        orm_mode = True
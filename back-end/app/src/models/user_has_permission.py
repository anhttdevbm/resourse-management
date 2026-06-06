"""Define user permission."""
from sqlalchemy import BOOLEAN, UUID, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.src.models.base_model import Base
from app.src.utils.common import generate_uuid


class UserHasPermission(Base):
    """Define user permission model."""

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid) # noqa
    user_system_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    permission_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("permissions.id"))
    is_deleted: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)

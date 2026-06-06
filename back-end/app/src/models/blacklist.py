"""Models of blacklisted token."""
import uuid

from sqlalchemy import BOOLEAN, TIMESTAMP, UUID, Column, String, func
from sqlalchemy.orm import Mapped, mapped_column

from ..utils.common import generate_uuid
from .base_model import Base


class BlacklistToken(Base):
    """Models of blacklisted token."""

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)  # noqa
    token: Mapped[str] = mapped_column(String, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    is_deleted: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)

"""User search history model."""
import uuid

from sqlalchemy import TIMESTAMP, Integer, String, UUID, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.src.utils.common import generate_uuid

from .base_model import Base


class SearchHistory(Base):
    """A search query recorded for a user."""

    __tablename__ = "search_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=generate_uuid
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    query: Mapped[str] = mapped_column(String(500), nullable=False)
    query_key: Mapped[str] = mapped_column(String(500), nullable=False)
    resource_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    user_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    searched_at: Mapped[TIMESTAMP] = mapped_column(
        TIMESTAMP, server_default=func.now(), nullable=False
    )

    user = relationship("User", back_populates="search_history")

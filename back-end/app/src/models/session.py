"""Define Session model."""
from sqlalchemy import TIMESTAMP, Column, String, func

from .base_model import Base


class Session(Base):
    """Define Session model."""

    __tablename__ = "sessions"  # type: ignore
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

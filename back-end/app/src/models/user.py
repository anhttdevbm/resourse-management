"""Define user model."""
import uuid
from typing import TYPE_CHECKING, List
from sqlalchemy import BOOLEAN, TIMESTAMP, UUID, Column, String, Text, func, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.src.utils.common import generate_uuid
from .base_model import Base
from .user_has_permission import UserHasPermission
from .permission import Permission

if TYPE_CHECKING:
    from .notification import Notification

class User(Base):
    """Define user model."""
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid) # noqa
    email = Column(String, nullable=False)
    name = Column(String, nullable=False)
    password = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.current_timestamp(), nullable=False)
    permissions: Mapped[List["Permission"]] = relationship(
         secondary=UserHasPermission.__tablename__,
         back_populates="users")
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    is_deleted: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    facebook_id = Column(String, unique=True, index=True, nullable=True)
    twitter_id = Column(String, unique=True, index=True, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    github_id = Column(String, unique=True, index=True, nullable=True)
    avatar_url = Column(Text, nullable=True)
    preferences = Column(JSONB, nullable=True)
    # resources shared TO this user (from other owners)
    shared_resources: Mapped[List["ResourceShare"]] = relationship(
        "ResourceShare",
        back_populates="shared_with",
        cascade="all, delete-orphan",
    )
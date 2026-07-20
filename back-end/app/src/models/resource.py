"""Define resource model."""

import uuid
from typing import Optional
from sqlalchemy import TIMESTAMP, UUID, ForeignKey, String, func, BOOLEAN, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.src.utils.common import generate_uuid
from .base_model import Base
from .resource_has_resource_tag import resource_resource_tag

class Resource(Base):
    """Define resource model.""" 
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)  # noqa
    name: Mapped[str] = mapped_column(String, nullable=False)
    version: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[TIMESTAMP] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    stage_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey('resource_stages.id'), nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id'),
                                                            nullable=False)
    status_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey('resource_statuss.id'), nullable=True)
    resource_status = relationship("ResourceStatus", back_populates="resources")
    url: Mapped[str] = mapped_column(String, nullable=False)
    platform_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey('resource_platforms.id'), nullable=True)
    product_type_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey('product_types.id'), nullable=True)
    repo_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey('package_repos.id'), nullable=True)
    resource_tags = relationship("ResourceTag", secondary=resource_resource_tag, back_populates="resources")
    is_deleted: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    download_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    shares = relationship(
        "ResourceShare",
        back_populates="resource",
        cascade="all, delete-orphan",
    )
    download_logs = relationship(
        "DownloadLog",
        back_populates="resource",
        cascade="all, delete-orphan",
    )
    favorited_by = relationship(
        "UserFavorite",
        back_populates="resource",
        cascade="all, delete-orphan",
    )
    bookmarked_by = relationship(
        "UserBookmark",
        back_populates="resource",
        cascade="all, delete-orphan",
    )
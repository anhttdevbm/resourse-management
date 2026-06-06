"""Quy tắc phân loại tự động tài nguyên — mỗi user một bộ riêng."""
import uuid
from typing import Optional

from sqlalchemy import BOOLEAN, TIMESTAMP, UUID, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.src.utils.common import generate_uuid
from .base_model import Base


class AutoClassificationRule(Base):
    """Điều kiện khớp tên/ext + gán metadata (stage, tag, …)."""

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    enabled: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, server_default="true")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    match_field: Mapped[str] = mapped_column(String(32), nullable=False)
    match_op: Mapped[str] = mapped_column(String(32), nullable=False)
    pattern: Mapped[str] = mapped_column(String(512), nullable=False)
    assign_stage_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resource_stages.id"), nullable=True
    )
    assign_product_type_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_types.id"), nullable=True
    )
    assign_platform_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resource_platforms.id"), nullable=True
    )
    assign_tag_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resource_tags.id"), nullable=True
    )
    assign_status_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resource_statuss.id"), nullable=True
    )
    assign_repo_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("package_repos.id"), nullable=True
    )
    created_at: Mapped[TIMESTAMP] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at: Mapped[TIMESTAMP] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    is_deleted: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)

    class Config:
        orm_mode = True

"""Per-user override: tắt/bật quy tắc hệ thống mà không sửa row dùng chung."""
import uuid

from sqlalchemy import BOOLEAN, TIMESTAMP, UUID, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.src.utils.common import generate_uuid
from .base_model import Base


class AutoClassificationRuleOverride(Base):
    """User có thể tắt (hoặc bật lại) một system rule riêng cho mình."""

    __tablename__ = "auto_classification_rule_overrides"  # type: ignore
    __table_args__ = (
        UniqueConstraint("user_id", "rule_id", name="uq_auto_class_rule_override_user_rule"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("auto_classification_rules.id"), nullable=False
    )
    enabled: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, server_default="true")
    created_at: Mapped[TIMESTAMP] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at: Mapped[TIMESTAMP] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)

    class Config:
        orm_mode = True

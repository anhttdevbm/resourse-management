"""Per-user enable/disable for system auto-classification rules.

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-07-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "h8i9j0k1l2m3"
down_revision: Union[str, None] = "g7h8i9j0k1l2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "auto_classification_rule_overrides",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "rule_id",
            UUID(as_uuid=True),
            sa.ForeignKey("auto_classification_rules.id"),
            nullable=False,
        ),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("user_id", "rule_id", name="uq_auto_class_rule_override_user_rule"),
    )
    op.create_index(
        "ix_auto_class_rule_overrides_user",
        "auto_classification_rule_overrides",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_auto_class_rule_overrides_user", table_name="auto_classification_rule_overrides")
    op.drop_table("auto_classification_rule_overrides")

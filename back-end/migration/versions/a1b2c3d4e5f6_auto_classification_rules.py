"""auto_classification_rules per user

Revision ID: a1b2c3d4e5f6
Revises: 7e66bbf6d64c
Create Date: 2026-04-13

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "7e66bbf6d64c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "auto_classification_rules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("match_field", sa.String(32), nullable=False),
        sa.Column("match_op", sa.String(32), nullable=False),
        sa.Column("pattern", sa.String(512), nullable=False),
        sa.Column("assign_stage_id", UUID(as_uuid=True), sa.ForeignKey("resource_stages.id"), nullable=True),
        sa.Column("assign_product_type_id", UUID(as_uuid=True), sa.ForeignKey("product_types.id"), nullable=True),
        sa.Column("assign_platform_id", UUID(as_uuid=True), sa.ForeignKey("resource_platforms.id"), nullable=True),
        sa.Column("assign_tag_id", UUID(as_uuid=True), sa.ForeignKey("resource_tags.id"), nullable=True),
        sa.Column("assign_status_id", UUID(as_uuid=True), sa.ForeignKey("resource_statuss.id"), nullable=True),
        sa.Column("assign_repo_id", UUID(as_uuid=True), sa.ForeignKey("package_repos.id"), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.create_index(
        "ix_auto_classification_rules_user_sort",
        "auto_classification_rules",
        ["user_id", "sort_order"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_auto_classification_rules_user_sort", table_name="auto_classification_rules")
    op.drop_table("auto_classification_rules")

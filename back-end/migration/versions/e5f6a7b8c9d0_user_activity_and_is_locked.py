"""User favorites/bookmarks/search history tables and users.is_locked.

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-07-02

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_locked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )

    op.create_table(
        "user_favorites",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("resource_id", UUID(as_uuid=True), sa.ForeignKey("resources.id"), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", "resource_id", name="uq_user_favorites_user_resource"),
    )
    op.create_index("ix_user_favorites_user_id", "user_favorites", ["user_id"])

    op.create_table(
        "user_bookmarks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("resource_id", UUID(as_uuid=True), sa.ForeignKey("resources.id"), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", "resource_id", name="uq_user_bookmarks_user_resource"),
    )
    op.create_index("ix_user_bookmarks_user_id", "user_bookmarks", ["user_id"])

    op.create_table(
        "search_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("query", sa.String(500), nullable=False),
        sa.Column("query_key", sa.String(500), nullable=False),
        sa.Column("resource_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("user_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "searched_at",
            sa.TIMESTAMP(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", "query_key", name="uq_search_history_user_query"),
    )
    op.create_index("ix_search_history_user_id", "search_history", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_search_history_user_id", table_name="search_history")
    op.drop_table("search_history")
    op.drop_index("ix_user_bookmarks_user_id", table_name="user_bookmarks")
    op.drop_table("user_bookmarks")
    op.drop_index("ix_user_favorites_user_id", table_name="user_favorites")
    op.drop_table("user_favorites")
    op.drop_column("users", "is_locked")

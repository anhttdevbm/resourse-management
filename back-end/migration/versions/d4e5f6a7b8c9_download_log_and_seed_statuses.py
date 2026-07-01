"""Seed resource statuses, download_logs table, download_count on resources.

Revision ID: d4e5f6a7b8c9
Revises: b3c4d5e6f7a
Create Date: 2026-07-01

"""
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "b3c4d5e6f7a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_STATUS_NAMES = ("Pending", "Approved", "Rejected")


def upgrade() -> None:
    conn = op.get_bind()
    for name in _STATUS_NAMES:
        exists = conn.execute(
            sa.text(
                "SELECT 1 FROM resource_statuss WHERE name = :name AND is_deleted = false LIMIT 1"
            ),
            {"name": name},
        ).fetchone()
        if not exists:
            conn.execute(
                sa.text(
                    "INSERT INTO resource_statuss (id, name, is_deleted) VALUES (:id, :name, false)"
                ),
                {"id": str(uuid.uuid4()), "name": name},
            )

    op.add_column(
        "resources",
        sa.Column("download_count", sa.Integer(), server_default="0", nullable=False),
    )

    op.create_table(
        "download_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("resource_id", UUID(as_uuid=True), sa.ForeignKey("resources.id"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "downloaded_at",
            sa.TIMESTAMP(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_download_logs_resource_id", "download_logs", ["resource_id"])
    op.create_index("ix_download_logs_downloaded_at", "download_logs", ["downloaded_at"])


def downgrade() -> None:
    op.drop_index("ix_download_logs_downloaded_at", table_name="download_logs")
    op.drop_index("ix_download_logs_resource_id", table_name="download_logs")
    op.drop_table("download_logs")
    op.drop_column("resources", "download_count")

    conn = op.get_bind()
    for name in _STATUS_NAMES:
        conn.execute(
            sa.text("DELETE FROM resource_statuss WHERE name = :name"),
            {"name": name},
        )

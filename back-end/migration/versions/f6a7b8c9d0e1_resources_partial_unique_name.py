"""Allow reusing resource name after soft-delete.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-07-07

"""
from typing import Sequence, Union

from alembic import op

revision = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
  op.drop_constraint("resources_name_key", "resources", type_="unique")
  op.execute(
    "CREATE UNIQUE INDEX uq_resources_name_active "
    "ON resources (name) WHERE is_deleted = false"
  )


def downgrade() -> None:
  op.execute("DROP INDEX IF EXISTS uq_resources_name_active")
  op.create_unique_constraint("resources_name_key", "resources", ["name"])

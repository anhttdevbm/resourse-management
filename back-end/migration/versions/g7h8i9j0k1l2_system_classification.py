"""System auto-classification rules + catalog seed.

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2026-07-07

"""
from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from alembic import op

revision = "g7h8i9j0k1l2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_CATALOG = [
    ("resource_stages", "Development"),
    ("resource_stages", "Staging"),
    ("resource_stages", "Production"),
    ("resource_platforms", "Android"),
    ("resource_platforms", "Windows"),
    ("resource_platforms", "Linux"),
    ("resource_platforms", "macOS"),
    ("resource_platforms", "Web"),
    ("product_types", "Mobile App"),
    ("product_types", "Desktop Software"),
    ("product_types", "Document"),
    ("product_types", "Archive"),
    ("product_types", "Media"),
]

_SYSTEM_RULES = [
    ("Android APK", "apk", "Android", "Mobile App", "Development"),
    ("Android App Bundle", "aab", "Android", "Mobile App", "Development"),
    ("Windows Executable", "exe", "Windows", "Desktop Software", "Development"),
    ("Windows Installer", "msi", "Windows", "Desktop Software", "Development"),
    ("macOS Disk Image", "dmg", "macOS", "Desktop Software", "Development"),
    ("Linux Package", "deb", "Linux", "Desktop Software", "Development"),
    ("ISO Image", "iso", "Linux", "Archive", "Staging"),
    ("PDF Document", "pdf", "Web", "Document", "Development"),
    ("Word Document", "docx", "Web", "Document", "Development"),
    ("Word Document (legacy)", "doc", "Web", "Document", "Development"),
    ("ZIP Archive", "zip", "Web", "Archive", "Development"),
    ("RAR Archive", "rar", "Web", "Archive", "Development"),
    ("7-Zip Archive", "7z", "Web", "Archive", "Development"),
    ("Video MP4", "mp4", "Web", "Media", "Production"),
    ("Video MOV", "mov", "Web", "Media", "Production"),
    ("Image JPEG", "jpg", "Web", "Media", "Production"),
    ("Image PNG", "png", "Web", "Media", "Production"),
    ("Markdown / Docs", "md", "Web", "Document", "Development"),
]


def _lookup_or_create(conn, table: str, name: str) -> uuid.UUID:
    row = conn.execute(
        sa.text(f"SELECT id FROM {table} WHERE name = :name AND is_deleted = false LIMIT 1"),
        {"name": name},
    ).fetchone()
    if row:
        return row[0]
    new_id = uuid.uuid4()
    conn.execute(
        sa.text(
            f"""
            INSERT INTO {table} (id, name, created_at, updated_at, is_deleted)
            VALUES (:id, :name, now(), now(), false)
            """
        ),
        {"id": str(new_id), "name": name},
    )
    return new_id


def upgrade() -> None:
    op.add_column(
        "auto_classification_rules",
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.alter_column("auto_classification_rules", "user_id", nullable=True)

    conn = op.get_bind()
    for table, name in _CATALOG:
        _lookup_or_create(conn, table, name)

    for order, (title, ext, platform, product_type, stage) in enumerate(_SYSTEM_RULES):
        rule_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"rms-system-rule-{ext}")
        exists = conn.execute(
            sa.text("SELECT 1 FROM auto_classification_rules WHERE id = :id LIMIT 1"),
            {"id": str(rule_id)},
        ).fetchone()
        if exists:
            continue
        stage_id = _lookup_or_create(conn, "resource_stages", stage)
        platform_id = _lookup_or_create(conn, "resource_platforms", platform)
        product_type_id = _lookup_or_create(conn, "product_types", product_type)
        conn.execute(
            sa.text(
                """
                INSERT INTO auto_classification_rules (
                    id, user_id, is_system, sort_order, enabled, title,
                    match_field, match_op, pattern,
                    assign_stage_id, assign_product_type_id, assign_platform_id,
                    assign_tag_id, assign_status_id, assign_repo_id,
                    created_at, updated_at, is_deleted
                ) VALUES (
                    :id, NULL, true, :sort_order, true, :title,
                    'extension', 'equals', :pattern,
                    :stage_id, :product_type_id, :platform_id,
                    NULL, NULL, NULL,
                    now(), now(), false
                )
                """
            ),
            {
                "id": str(rule_id),
                "sort_order": order,
                "title": title,
                "pattern": ext,
                "stage_id": str(stage_id),
                "product_type_id": str(product_type_id),
                "platform_id": str(platform_id),
            },
        )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM auto_classification_rules WHERE is_system = true"))
    op.alter_column("auto_classification_rules", "user_id", nullable=False)
    op.drop_column("auto_classification_rules", "is_system")

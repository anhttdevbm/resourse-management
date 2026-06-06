"""seed_init_admin_user

Revision ID: 7e66bbf6d64c
Revises: c3e514f72ae5
Create Date: 2023-03-22 16:06:20.205023

"""
import uuid
from datetime import datetime
from alembic import op
# revision identifiers, used by Alembic.
from sqlalchemy import table, column, String, UUID, BOOLEAN

from app.src.utils.security import get_password_hash

revision = '7e66bbf6d64c'
down_revision = 'c3e514f72ae5'
branch_labels = None
depends_on = None
user_table = table(
    "users",
    column("id", UUID),
    column("email", String),
    column("password", String),
    column("name", String),
    column("is_deleted", BOOLEAN),
)
permission_table = table(
    'permissions',
    column('id', UUID),
    column('name', String),
    column('is_deleted', BOOLEAN)
)
user_has_permission_table = table(
    'user_has_permissions',
    column('id', UUID),
    column('user_system_id', UUID),
    column('permission_id', UUID),
    column('is_deleted', BOOLEAN)
)
notification_table = table(
    'notifications',
    column('id', UUID),
    column('user_id', UUID),
    column('title', String),
    column('message', String),
    column('type', String),
    column('source', String),
    column('is_read', BOOLEAN),
)
system_info_table = table(
    'system_info',
    column('id', UUID),
    column('system_name', String),
    column('status', String),
    column('version', String),
    column('is_deleted', BOOLEAN)
)
user_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, datetime.now().isoformat())
permission_data = ["User:Create", "User:Read", "User:Update", "User:Delete",
                   "User:AddPermission", "User:AllAccess"]
permission_id_admin = uuid.uuid5(uuid.NAMESPACE_DNS, datetime.now().isoformat())
permission_ids = [uuid.uuid5(uuid.NAMESPACE_DNS, permission) for permission in permission_data]
admin_system_permission_id = uuid.uuid5(uuid.NAMESPACE_DNS, datetime.now().isoformat())
system_info_id = uuid.uuid5(uuid.NAMESPACE_DNS, "system_info_default")
notification_id = uuid.uuid5(uuid.NAMESPACE_DNS, "admin_notification_default")
def upgrade() -> None:
    # Kiểm tra xem admin user đã tồn tại chưa
    from sqlalchemy import text
    connection = op.get_bind()
    result = connection.execute(
        text("SELECT id FROM users WHERE email = 'admin@truongtuananh.com'")
    )
    existing_admin_id = result.scalar()
    admin_exists = existing_admin_id is not None
    
    if not admin_exists:
        op.bulk_insert(
            user_table,
            [
                {
                    "id": user_uuid,
                    "email": "admin@truongtuananh.com",
                    "password": get_password_hash('123456'),
                    "name": "Admin",
                    "is_deleted": False,
                }
            ],
        )
        admin_user_id = user_uuid
    else:
        admin_user_id = existing_admin_id
    # Kiểm tra và insert permissions nếu chưa tồn tại
    for index, permission in enumerate(permission_data):
        result = connection.execute(
            text("SELECT COUNT(*) FROM permissions WHERE name = :permission"),
            {"permission": permission}
        )
        if result.scalar() == 0:
            op.bulk_insert(
                permission_table,
                [
                    {
                        "id": permission_ids[index],
                        "name": permission,
                        "is_deleted": False,
                    }
                ],
            )
    
    # Kiểm tra AllAccess permission
    result = connection.execute(
        text("SELECT COUNT(*) FROM permissions WHERE name = 'AllAccess'")
    )
    if result.scalar() == 0:
        op.bulk_insert(
            permission_table,
            [
                {
                    "id": permission_id_admin,
                    "name": "AllAccess",
                    "is_deleted": False,
                }
            ],
        )
    # Kiểm tra và insert user_has_permission nếu chưa tồn tại
    result = connection.execute(
        text("SELECT COUNT(*) FROM user_has_permissions WHERE user_system_id = :user_id AND permission_id = :permission_id"),
        {"user_id": str(user_uuid), "permission_id": str(permission_id_admin)}
    )
    if result.scalar() == 0:
        op.bulk_insert(
            user_has_permission_table,
            [
                {
                    "id": admin_system_permission_id,
                    "user_system_id": admin_user_id,
                    "permission_id": permission_id_admin,
                    "is_deleted": False,
                }
            ],
        )
    
    # Kiểm tra và insert system_info nếu chưa tồn tại
    result = connection.execute(
        text("SELECT COUNT(*) FROM system_info WHERE id = :system_info_id"),
        {"system_info_id": str(system_info_id)}
    )
    if result.scalar() == 0:
        op.bulk_insert(
            system_info_table,
            [
                {
                    "id": system_info_id,
                    "system_name": "Hệ thống quản lý tài nguyên",
                    "status": "Online",
                    "version": "v1.0.0",
                    "is_deleted": False,
                }
            ],
        )
    
    # Seed a default notification for admin if none exists
    result = connection.execute(
        text("SELECT COUNT(*) FROM notifications WHERE user_id = :user_id"),
        {"user_id": str(admin_user_id)}
    )
    if result.scalar() == 0:
        op.bulk_insert(
            notification_table,
            [
                {
                    "id": notification_id,
                    "user_id": admin_user_id,
                    "title": "Chào mừng quản trị viên",
                    "message": "Tài khoản quản trị đã được khởi tạo thành công.",
                    "type": "system",
                    "source": "seed",
                    "is_read": False,
                }
            ],
        )

def downgrade() -> None:
    pass

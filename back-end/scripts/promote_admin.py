#!/usr/bin/env python3
"""
Nâng một tài khoản lên Admin bằng cách gán permission "AllAccess".

Cách chạy (từ thư mục back-end):
  python scripts/promote_admin.py <email_user>
Ví dụ:
  python scripts/promote_admin.py user@example.com
"""
import os
import sys
import uuid

# Thêm thư mục back-end vào path để import app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import text
from app.src.utils.connection.sql_connection import engine


def promote_to_admin(email: str) -> None:
    if not email or "@" not in email:
        print("❌ Vui lòng nhập email hợp lệ. Ví dụ: python scripts/promote_admin.py user@example.com")
        sys.exit(1)

    with engine.connect() as conn:
        # Lấy user_id theo email
        r = conn.execute(text("SELECT id FROM users WHERE email = :email AND is_deleted = false"), {"email": email})
        row = r.fetchone()
        if not row:
            print(f"❌ Không tìm thấy user với email: {email}")
            sys.exit(1)
        user_id = row[0]

        # Lấy permission_id của AllAccess (tạo nếu chưa có)
        r = conn.execute(text("SELECT id FROM permissions WHERE name = 'AllAccess' AND is_deleted = false"))
        perm_row = r.fetchone()
        if not perm_row:
            permission_id = uuid.uuid4()
            conn.execute(
                text("""
                    INSERT INTO permissions (id, name, created_at, updated_at, is_deleted)
                    VALUES (:id, 'AllAccess', now(), now(), false)
                """),
                {"id": permission_id},
            )
            conn.commit()
            print("✅ Đã tạo permission 'AllAccess' trong database.")
        else:
            permission_id = perm_row[0]

        # Kiểm tra đã gán chưa
        r = conn.execute(
            text("""
                SELECT id FROM user_has_permissions
                WHERE user_system_id = :user_id AND permission_id = :perm_id AND is_deleted = false
            """),
            {"user_id": user_id, "perm_id": permission_id},
        )
        if r.fetchone():
            print(f"✅ User {email} đã có quyền Admin (AllAccess) rồi.")
            return

        # Gán AllAccess cho user
        link_id = uuid.uuid4()
        conn.execute(
            text("""
                INSERT INTO user_has_permissions (id, user_system_id, permission_id, is_deleted)
                VALUES (:id, :user_id, :permission_id, false)
            """),
            {"id": link_id, "user_id": user_id, "permission_id": permission_id},
        )
        conn.commit()
    print(f"✅ Đã nâng user '{email}' lên Admin (đã gán permission AllAccess).")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Cách dùng: python scripts/promote_admin.py <email_user>")
        print("Ví dụ:     python scripts/promote_admin.py user@example.com")
        sys.exit(1)
    promote_to_admin(sys.argv[1].strip())

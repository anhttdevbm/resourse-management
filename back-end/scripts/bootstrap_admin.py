#!/usr/bin/env python3
"""
Tạo (nếu chưa có) và gán quyền AllAccess cho admin bootstrap sau deploy.

Biến trong product.env / .env:
  BOOTSTRAP_ADMIN_EMAIL
  BOOTSTRAP_ADMIN_PASSWORD
  BOOTSTRAP_ADMIN_NAME
"""
from __future__ import annotations

import os
import sys
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import bootstrap_env  # noqa: F401

bootstrap_env.configure_env()

import decouple
from sqlalchemy import text

from app.src.utils.connection.sql_connection import engine
from app.src.utils.security import get_password_hash


def _cfg(name: str, default: str = "") -> str:
    try:
        return str(decouple.config(name, default=default)).strip()
    except Exception:
        return os.environ.get(name, default).strip()


def ensure_all_access_permission(conn, email: str) -> None:
    perm_row = conn.execute(
        text("SELECT id FROM permissions WHERE name = 'AllAccess' AND is_deleted = false")
    ).fetchone()
    if not perm_row:
        permission_id = uuid.uuid4()
        conn.execute(
            text(
                """
                INSERT INTO permissions (id, name, created_at, updated_at, is_deleted)
                VALUES (:id, 'AllAccess', now(), now(), false)
                """
            ),
            {"id": permission_id},
        )
        conn.commit()
        print("Created permission AllAccess")
    else:
        permission_id = perm_row[0]

    user_row = conn.execute(
        text("SELECT id FROM users WHERE email = :email AND is_deleted = false"),
        {"email": email},
    ).fetchone()
    if not user_row:
        password = _cfg("BOOTSTRAP_ADMIN_PASSWORD")
        if not password:
            print("BOOTSTRAP_ADMIN_PASSWORD is required to create a new admin user.")
            sys.exit(1)
        name = _cfg("BOOTSTRAP_ADMIN_NAME", "Admin")
        user_id = uuid.uuid4()
        conn.execute(
            text(
                """
                INSERT INTO users (id, email, name, password, created_at, updated_at, is_deleted)
                VALUES (:id, :email, :name, :password, now(), now(), false)
                """
            ),
            {
                "id": user_id,
                "email": email,
                "name": name,
                "password": get_password_hash(password),
            },
        )
        conn.commit()
        print(f"Created user {email}")
    else:
        user_id = user_row[0]

    link = conn.execute(
        text(
            """
            SELECT id FROM user_has_permissions
            WHERE user_system_id = :user_id AND permission_id = :perm_id AND is_deleted = false
            """
        ),
        {"user_id": user_id, "perm_id": permission_id},
    ).fetchone()
    if link:
        print(f"User {email} already has AllAccess.")
        return

    conn.execute(
        text(
            """
            INSERT INTO user_has_permissions (id, user_system_id, permission_id, is_deleted)
            VALUES (:id, :user_id, :permission_id, false)
            """
        ),
        {"id": uuid.uuid4(), "user_id": user_id, "permission_id": permission_id},
    )
    conn.commit()
    print(f"Granted AllAccess to {email}")


def main() -> None:
    email = _cfg("BOOTSTRAP_ADMIN_EMAIL")
    if not email or "@" not in email:
        print("Skip bootstrap admin: BOOTSTRAP_ADMIN_EMAIL not set.")
        return

    with engine.connect() as conn:
        ensure_all_access_permission(conn, email)


if __name__ == "__main__":
    main()

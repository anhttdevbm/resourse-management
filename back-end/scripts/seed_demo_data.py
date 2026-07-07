#!/usr/bin/env python3
"""
Seed dữ liệu demo cho môi trường local — mô phỏng hệ thống đã vận hành ~3 tháng.

Chạy tự động khi docker compose up (nếu SEED_DEMO_DATA=true).
Idempotent: bỏ qua nếu đã seed (phát hiện qua user demo đầu tiên).

Biến môi trường:
  SEED_DEMO_DATA=true|false   — bật/tắt (mặc định: true khi ENV=DEV)
  SEED_DEMO_PASSWORD          — mật khẩu user demo (mặc định: Demo@2026!)
"""
from __future__ import annotations

import os
import random
import sys
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import bootstrap_env  # noqa: F401

bootstrap_env.configure_env()

import decouple
from sqlalchemy import text

from app.src.utils.connection.sql_connection import engine
from app.src.utils.security import get_password_hash

_NS = uuid.NAMESPACE_DNS
_MARKER_EMAIL = "nguyen.van.a@demo.local"
_DEMO_PASSWORD_DEFAULT = "Demo@2026!"

_DEMO_USERS = [
    ("nguyen.van.a@demo.local", "Nguyễn Văn A"),
    ("tran.thi.b@demo.local", "Trần Thị B"),
    ("le.van.c@demo.local", "Lê Văn C"),
    ("pham.thi.d@demo.local", "Phạm Thị D"),
    ("hoang.van.e@demo.local", "Hoàng Văn E"),
]

_REPOS = {
    "nguyen.van.a@demo.local": ["Kho phát hành chính", "Bản beta nội bộ"],
    "tran.thi.b@demo.local": ["Backend builds", "API artifacts"],
    "le.van.c@demo.local": ["QA test packages", "Regression builds"],
    "pham.thi.d@demo.local": ["Design assets", "UI kits"],
    "hoang.van.e@demo.local": ["Infra releases", "Server images"],
}

_TAGS = {
    "nguyen.van.a@demo.local": ["mobile", "release", "priority-high"],
    "tran.thi.b@demo.local": ["api", "backend", "microservice"],
    "le.van.c@demo.local": ["qa", "regression", "staging"],
    "pham.thi.d@demo.local": ["ui", "design", "figma-export"],
    "hoang.van.e@demo.local": ["devops", "docker", "infra"],
}

# (name, version, stage, platform, product_type, status, ext, owner_email, days_ago, repo_idx, tag_idx)
_RESOURCES = [
    ("RMS Mobile Android 2.1.0", "2.1.0", "Production", "Android", "Mobile App", "Approved", "apk", "nguyen.van.a@demo.local", 2, 0, 0),
    ("RMS Mobile Android 2.0.8", "2.0.8", "Production", "Android", "Mobile App", "Approved", "apk", "nguyen.van.a@demo.local", 18, 0, 0),
    ("RMS Mobile Android 2.0.5", "2.0.5", "Staging", "Android", "Mobile App", "Approved", "apk", "nguyen.van.a@demo.local", 35, 1, 1),
    ("RMS Mobile AAB Release", "2.1.0", "Production", "Android", "Mobile App", "Approved", "aab", "nguyen.van.a@demo.local", 3, 0, 0),
    ("HR Portal Windows", "1.4.2", "Production", "Windows", "Desktop Software", "Approved", "exe", "tran.thi.b@demo.local", 7, 0, 0),
    ("HR Portal Windows MSI", "1.4.2", "Production", "Windows", "Desktop Software", "Approved", "msi", "tran.thi.b@demo.local", 8, 0, 0),
    ("HR Portal macOS", "1.4.0", "Production", "macOS", "Desktop Software", "Approved", "dmg", "tran.thi.b@demo.local", 22, 0, 0),
    ("API Gateway Config Pack", "3.2.1", "Staging", "Linux", "Archive", "Approved", "zip", "tran.thi.b@demo.local", 14, 1, 1),
    ("Auth Service Build", "1.8.0", "Development", "Linux", "Desktop Software", "Pending", "deb", "tran.thi.b@demo.local", 1, 1, 1),
    ("Notification Worker", "0.9.4", "Development", "Linux", "Desktop Software", "Pending", "deb", "tran.thi.b@demo.local", 0, 1, 1),
    ("QA Regression Suite Q1", "2026.1", "Staging", "Web", "Archive", "Approved", "zip", "le.van.c@demo.local", 28, 0, 0),
    ("QA Regression Suite Q2", "2026.2", "Staging", "Web", "Archive", "Approved", "zip", "le.van.c@demo.local", 12, 0, 0),
    ("UAT Test Report March", "1.0", "Development", "Web", "Document", "Approved", "pdf", "le.van.c@demo.local", 40, 1, 1),
    ("UAT Test Report April", "1.0", "Development", "Web", "Document", "Approved", "pdf", "le.van.c@demo.local", 25, 1, 1),
    ("Smoke Test APK", "1.0.0-rc3", "Staging", "Android", "Mobile App", "Pending", "apk", "le.van.c@demo.local", 4, 0, 2),
    ("Dashboard UI Kit", "4.0", "Production", "Web", "Document", "Approved", "zip", "pham.thi.d@demo.local", 30, 0, 0),
    ("Brand Guidelines 2026", "2.0", "Production", "Web", "Document", "Approved", "pdf", "pham.thi.d@demo.local", 55, 0, 0),
    ("Icon Set RMS", "1.2", "Production", "Web", "Media", "Approved", "png", "pham.thi.d@demo.local", 20, 1, 1),
    ("Onboarding Screens Mockup", "1.0", "Development", "Web", "Media", "Approved", "png", "pham.thi.d@demo.local", 10, 1, 1),
    ("Promo Video Launch", "1.0", "Production", "Web", "Media", "Approved", "mp4", "pham.thi.d@demo.local", 15, 0, 0),
    ("Server Agent Linux", "2.3.0", "Production", "Linux", "Desktop Software", "Approved", "deb", "hoang.van.e@demo.local", 16, 0, 0),
    ("Docker Compose Stack", "1.1", "Production", "Linux", "Archive", "Approved", "zip", "hoang.van.e@demo.local", 33, 0, 0),
    ("K8s Manifests Staging", "0.8", "Staging", "Linux", "Archive", "Approved", "zip", "hoang.van.e@demo.local", 9, 1, 1),
    ("Monitoring Stack ISO", "2026.03", "Production", "Linux", "Archive", "Approved", "iso", "hoang.van.e@demo.local", 45, 0, 2),
    ("Legacy Migration Archive", "0.1", "Development", "Web", "Archive", "Rejected", "rar", "hoang.van.e@demo.local", 60, 1, 0),
    ("Internal API Spec", "3.0", "Production", "Web", "Document", "Approved", "docx", "tran.thi.b@demo.local", 42, 1, 0),
    ("Release Notes Q2", "2026.2", "Production", "Web", "Document", "Approved", "md", "nguyen.van.a@demo.local", 6, 0, 2),
    ("Sprint Demo Recording", "S24", "Staging", "Web", "Media", "Approved", "mp4", "nguyen.van.a@demo.local", 11, 1, 1),
    ("Windows Hotfix KB-1042", "1.0.1", "Production", "Windows", "Desktop Software", "Approved", "exe", "tran.thi.b@demo.local", 5, 0, 0),
    ("Mobile Beta Feedback Pack", "1.0", "Development", "Android", "Document", "Pending", "pdf", "le.van.c@demo.local", 3, 1, 0),
]

_SEARCH_QUERIES = [
    ("android", 8, 2),
    ("hr portal", 4, 1),
    ("qa regression", 3, 1),
    ("docker", 5, 2),
    ("api spec", 2, 1),
    ("ui kit", 3, 1),
    ("release notes", 2, 1),
    ("windows installer", 3, 1),
]

_SHARES = [
    # (resource_name, version, shared_with_email, can_edit)
    ("RMS Mobile Android 2.1.0", "2.1.0", "tran.thi.b@demo.local", False),
    ("HR Portal Windows", "1.4.2", "le.van.c@demo.local", False),
    ("Dashboard UI Kit", "4.0", "nguyen.van.a@demo.local", False),
    ("API Gateway Config Pack", "3.2.1", "hoang.van.e@demo.local", True),
    ("QA Regression Suite Q2", "2026.2", "tran.thi.b@demo.local", False),
    ("Server Agent Linux", "2.3.0", "tran.thi.b@demo.local", False),
    ("Brand Guidelines 2026", "2.0", "pham.thi.d@demo.local", False),
    ("Promo Video Launch", "1.0", "nguyen.van.a@demo.local", False),
]

_FAVORITES = [
    ("nguyen.van.a@demo.local", "RMS Mobile Android 2.1.0", "2.1.0"),
    ("nguyen.van.a@demo.local", "Release Notes Q2", "2026.2"),
    ("tran.thi.b@demo.local", "HR Portal Windows", "1.4.2"),
    ("tran.thi.b@demo.local", "Internal API Spec", "3.0"),
    ("le.van.c@demo.local", "QA Regression Suite Q2", "2026.2"),
    ("le.van.c@demo.local", "Smoke Test APK", "1.0.0-rc3"),
    ("pham.thi.d@demo.local", "Dashboard UI Kit", "4.0"),
    ("pham.thi.d@demo.local", "Brand Guidelines 2026", "2.0"),
    ("hoang.van.e@demo.local", "Docker Compose Stack", "1.1"),
    ("hoang.van.e@demo.local", "Server Agent Linux", "2.3.0"),
    ("tran.thi.b@demo.local", "RMS Mobile Android 2.1.0", "2.1.0"),
    ("le.van.c@demo.local", "HR Portal Windows", "1.4.2"),
]

_BOOKMARKS = [
    ("nguyen.van.a@demo.local", "Internal API Spec", "3.0", "Tham khảo khi review API"),
    ("tran.thi.b@demo.local", "Auth Service Build", "1.8.0", "Chờ duyệt deploy"),
    ("le.van.c@demo.local", "UAT Test Report April", "1.0", None),
    ("pham.thi.d@demo.local", "Onboarding Screens Mockup", "1.0", "Cần cập nhật màu brand"),
    ("hoang.van.e@demo.local", "K8s Manifests Staging", "0.8", "Deploy tuần sau"),
    ("nguyen.van.a@demo.local", "Sprint Demo Recording", "S24", None),
    ("tran.thi.b@demo.local", "Windows Hotfix KB-1042", "1.0.1", "Hotfix khẩn"),
    ("le.van.c@demo.local", "Mobile Beta Feedback Pack", "1.0", None),
]


def _cfg(name: str, default: str = "") -> str:
    try:
        return str(decouple.config(name, default=default)).strip()
    except Exception:
        return os.environ.get(name, default).strip()


def _enabled() -> bool:
    raw = _cfg("SEED_DEMO_DATA", "")
    if raw.lower() in ("false", "0", "no", "off"):
        return False
    if raw.lower() in ("true", "1", "yes", "on"):
        return True
    return _cfg("ENV", "DEV").upper() in ("DEV", "DEVELOPMENT", "LOCAL")


def _uid(key: str) -> uuid.UUID:
    return uuid.uuid5(_NS, f"rms-demo-{key}")


def _lookup_id(conn, table: str, name: str) -> uuid.UUID | None:
    row = conn.execute(
        text(f"SELECT id FROM {table} WHERE name = :name AND is_deleted = false LIMIT 1"),
        {"name": name},
    ).fetchone()
    return row[0] if row else None


def _resource_key(name: str, version: str) -> str:
    return f"{name}::{version}"


def _days_ago_ts(days: int) -> datetime:
    base = datetime.now().replace(microsecond=0)
    hour = random.randint(8, 18)
    minute = random.randint(0, 59)
    return (base - timedelta(days=days)).replace(hour=hour, minute=minute, second=0)


def _ensure_users(conn, password_hash: str) -> dict[str, uuid.UUID]:
    user_ids: dict[str, uuid.UUID] = {}
    for email, name in _DEMO_USERS:
        uid = _uid(f"user-{email}")
        exists = conn.execute(
            text("SELECT id FROM users WHERE email = :email LIMIT 1"),
            {"email": email},
        ).fetchone()
        if exists:
            user_ids[email] = exists[0]
            continue
        created = _days_ago_ts(90 - _DEMO_USERS.index((email, name)) * 5)
        conn.execute(
            text(
                """
                INSERT INTO users (id, email, name, password, created_at, updated_at, is_deleted, is_locked)
                VALUES (:id, :email, :name, :password, :created_at, :updated_at, false, false)
                """
            ),
            {
                "id": uid,
                "email": email,
                "name": name,
                "password": password_hash,
                "created_at": created,
                "updated_at": created,
            },
        )
        user_ids[email] = uid
        print(f"  + user: {name} ({email})")
    return user_ids


def _ensure_repos(conn, user_ids: dict[str, uuid.UUID]) -> dict[str, list[uuid.UUID]]:
    repo_ids: dict[str, list[uuid.UUID]] = {}
    for email, names in _REPOS.items():
        repo_ids[email] = []
        for idx, repo_name in enumerate(names):
            rid = _uid(f"repo-{email}-{idx}")
            exists = conn.execute(
                text(
                    "SELECT id FROM package_repos WHERE user_id = :uid AND name = :name LIMIT 1"
                ),
                {"uid": user_ids[email], "name": repo_name},
            ).fetchone()
            if exists:
                repo_ids[email].append(exists[0])
                continue
            ts = _days_ago_ts(85 - idx * 10)
            conn.execute(
                text(
                    """
                    INSERT INTO package_repos (id, user_id, name, created_at, updated_at, is_deleted)
                    VALUES (:id, :user_id, :name, :created_at, :updated_at, false)
                    """
                ),
                {
                    "id": rid,
                    "user_id": user_ids[email],
                    "name": repo_name,
                    "created_at": ts,
                    "updated_at": ts,
                },
            )
            repo_ids[email].append(rid)
    return repo_ids


def _ensure_tags(conn, user_ids: dict[str, uuid.UUID]) -> dict[str, list[uuid.UUID]]:
    tag_ids: dict[str, list[uuid.UUID]] = {}
    for email, names in _TAGS.items():
        tag_ids[email] = []
        for idx, tag_name in enumerate(names):
            tid = _uid(f"tag-{email}-{idx}")
            exists = conn.execute(
                text(
                    "SELECT id FROM resource_tags WHERE user_id = :uid AND name = :name LIMIT 1"
                ),
                {"uid": user_ids[email], "name": tag_name},
            ).fetchone()
            if exists:
                tag_ids[email].append(exists[0])
                continue
            ts = _days_ago_ts(80 - idx * 8)
            conn.execute(
                text(
                    """
                    INSERT INTO resource_tags (id, user_id, name, created_at, updated_at, is_deleted)
                    VALUES (:id, :user_id, :name, :created_at, :updated_at, false)
                    """
                ),
                {
                    "id": tid,
                    "user_id": user_ids[email],
                    "name": tag_name,
                    "created_at": ts,
                    "updated_at": ts,
                },
            )
            tag_ids[email].append(tid)
    return tag_ids


def _ensure_resources(
    conn,
    user_ids: dict[str, uuid.UUID],
    repo_ids: dict[str, list[uuid.UUID]],
    tag_ids: dict[str, list[uuid.UUID]],
    catalog: dict[str, dict[str, uuid.UUID]],
) -> dict[str, uuid.UUID]:
    resource_ids: dict[str, uuid.UUID] = {}
    for row in _RESOURCES:
        name, version, stage, platform, ptype, status, ext, owner, days_ago, repo_idx, tag_idx = row
        key = _resource_key(name, version)
        rid = _uid(f"resource-{key}")
        exists = conn.execute(
            text("SELECT id FROM resources WHERE name = :name AND version = :version LIMIT 1"),
            {"name": name, "version": version},
        ).fetchone()
        if exists:
            resource_ids[key] = exists[0]
            continue

        created = _days_ago_ts(days_ago)
        url = f"/uploads/demo/{version.replace('.', '_')}_{name.replace(' ', '_')}.{ext}"
        download_count = random.randint(3, 45) if status == "Approved" else random.randint(0, 3)

        conn.execute(
            text(
                """
                INSERT INTO resources (
                    id, name, version, stage_id, status_id, platform_id,
                    product_type_id, repo_id, user_id, created_at, is_deleted,
                    url, download_count
                ) VALUES (
                    :id, :name, :version, :stage_id, :status_id, :platform_id,
                    :product_type_id, :repo_id, :user_id, :created_at, false,
                    :url, :download_count
                )
                """
            ),
            {
                "id": rid,
                "name": name,
                "version": version,
                "stage_id": catalog["stages"][stage],
                "status_id": catalog["statuses"][status],
                "platform_id": catalog["platforms"][platform],
                "product_type_id": catalog["product_types"][ptype],
                "repo_id": repo_ids[owner][repo_idx],
                "user_id": user_ids[owner],
                "created_at": created,
                "url": url,
                "download_count": 0,
            },
        )

        tag_id = tag_ids[owner][tag_idx]
        conn.execute(
            text(
                """
                INSERT INTO resource_has_resource_tags (resource_id, resource_tag_id, is_deleted)
                VALUES (:resource_id, :tag_id, false)
                ON CONFLICT DO NOTHING
                """
            ),
            {"resource_id": rid, "tag_id": tag_id},
        )

        resource_ids[key] = rid
        _seed_downloads(conn, rid, user_ids, download_count, created)
        conn.execute(
            text("UPDATE resources SET download_count = :cnt WHERE id = :id"),
            {"cnt": download_count, "id": rid},
        )
        print(f"  + resource: {name} v{version} ({status})")

    return resource_ids


def _seed_downloads(
    conn,
    resource_id: uuid.UUID,
    user_ids: dict[str, uuid.UUID],
    count: int,
    since: datetime,
) -> None:
    if count <= 0:
        return
    all_users = list(user_ids.values())
    for i in range(count):
        dl_id = _uid(f"dl-{resource_id}-{i}")
        dl_user = random.choice(all_users)
        offset_days = random.randint(0, max(1, (datetime.now() - since).days))
        dl_at = since + timedelta(days=offset_days, hours=random.randint(0, 10))
        conn.execute(
            text(
                """
                INSERT INTO download_logs (id, resource_id, user_id, downloaded_at)
                VALUES (:id, :resource_id, :user_id, :downloaded_at)
                ON CONFLICT DO NOTHING
                """
            ),
            {
                "id": dl_id,
                "resource_id": resource_id,
                "user_id": dl_user,
                "downloaded_at": dl_at,
            },
        )


def _ensure_shares(conn, user_ids: dict[str, uuid.UUID], resource_ids: dict[str, uuid.UUID]) -> None:
    for name, version, shared_email, can_edit in _SHARES:
        key = _resource_key(name, version)
        res_id = resource_ids.get(key)
        if not res_id:
            continue
        sid = _uid(f"share-{key}-{shared_email}")
        conn.execute(
            text(
                """
                INSERT INTO resource_shares (id, resource_id, shared_with_user_id, can_edit, created_at)
                VALUES (:id, :resource_id, :user_id, :can_edit, :created_at)
                ON CONFLICT DO NOTHING
                """
            ),
            {
                "id": sid,
                "resource_id": res_id,
                "user_id": user_ids[shared_email],
                "can_edit": can_edit,
                "created_at": _days_ago_ts(random.randint(2, 20)),
            },
        )


def _ensure_favorites(conn, user_ids: dict[str, uuid.UUID], resource_ids: dict[str, uuid.UUID]) -> None:
    for email, name, version in _FAVORITES:
        key = _resource_key(name, version)
        res_id = resource_ids.get(key)
        if not res_id:
            continue
        fid = _uid(f"fav-{email}-{key}")
        conn.execute(
            text(
                """
                INSERT INTO user_favorites (id, user_id, resource_id, created_at)
                VALUES (:id, :user_id, :resource_id, :created_at)
                ON CONFLICT DO NOTHING
                """
            ),
            {
                "id": fid,
                "user_id": user_ids[email],
                "resource_id": res_id,
                "created_at": _days_ago_ts(random.randint(1, 30)),
            },
        )


def _ensure_bookmarks(conn, user_ids: dict[str, uuid.UUID], resource_ids: dict[str, uuid.UUID]) -> None:
    for email, name, version, note in _BOOKMARKS:
        key = _resource_key(name, version)
        res_id = resource_ids.get(key)
        if not res_id:
            continue
        bid = _uid(f"bm-{email}-{key}")
        conn.execute(
            text(
                """
                INSERT INTO user_bookmarks (id, user_id, resource_id, note, created_at)
                VALUES (:id, :user_id, :resource_id, :note, :created_at)
                ON CONFLICT DO NOTHING
                """
            ),
            {
                "id": bid,
                "user_id": user_ids[email],
                "resource_id": res_id,
                "note": note,
                "created_at": _days_ago_ts(random.randint(1, 25)),
            },
        )


def _ensure_search_history(conn, user_ids: dict[str, uuid.UUID]) -> None:
    emails = list(user_ids.keys())
    for idx, (query, res_cnt, usr_cnt) in enumerate(_SEARCH_QUERIES):
        email = emails[idx % len(emails)]
        qkey = query.lower().strip()
        sid = _uid(f"search-{email}-{qkey}")
        conn.execute(
            text(
                """
                INSERT INTO search_history (id, user_id, query, query_key, resource_count, user_count, searched_at)
                VALUES (:id, :user_id, :query, :query_key, :resource_count, :user_count, :searched_at)
                ON CONFLICT DO NOTHING
                """
            ),
            {
                "id": sid,
                "user_id": user_ids[email],
                "query": query,
                "query_key": qkey,
                "resource_count": res_cnt,
                "user_count": usr_cnt,
                "searched_at": _days_ago_ts(random.randint(1, 45)),
            },
        )


def _ensure_notifications(conn, user_ids: dict[str, uuid.UUID], admin_id: uuid.UUID | None) -> None:
    notifs = [
        ("nguyen.van.a@demo.local", "Phiên bản mới đã phê duyệt", "RMS Mobile Android v2.1.0 đã được phê duyệt và sẵn sàng phát hành.", "resource", True, 5),
        ("tran.thi.b@demo.local", "Tài nguyên được chia sẻ", "Nguyễn Văn A đã chia sẻ RMS Mobile Android v2.1.0 với bạn.", "share", False, 3),
        ("le.van.c@demo.local", "Chờ kiểm duyệt", "Smoke Test APK v1.0.0-rc3 đang chờ phê duyệt.", "review", False, 2),
        ("pham.thi.d@demo.local", "Tải xuống thành công", "Promo Video Launch đã được tải 12 lần tuần này.", "download", True, 8),
        ("hoang.van.e@demo.local", "Cập nhật hệ thống", "Docker Compose Stack v1.1 đã được deploy lên staging.", "system", True, 12),
        ("tran.thi.b@demo.local", "Yêu cầu duyệt", "Auth Service Build v1.8.0 cần được review trước khi deploy.", "review", False, 1),
        ("le.van.c@demo.local", "Báo cáo QA", "UAT Test Report April đã sẵn sàng để xem.", "resource", True, 20),
        ("nguyen.van.a@demo.local", "Nhắc nhở", "Còn 2 tài nguyên đang chờ phê duyệt trong kho của bạn.", "system", False, 0),
    ]
    if admin_id:
        notifs.append(
            (None, "Báo cáo hệ thống", "Demo data đã được nạp — 5 user, ~30 tài nguyên, lịch sử 3 tháng.", "system", False, 0)
        )

    for idx, item in enumerate(notifs):
        email, title, message, ntype, is_read, days_ago = item
        target = admin_id if email is None else user_ids.get(email or "")
        if not target:
            continue
        nid = _uid(f"notif-{target}-{idx}")
        created = _days_ago_ts(days_ago)
        conn.execute(
            text(
                """
                INSERT INTO notifications (
                    id, user_id, title, message, type, source, is_read, created_at, is_deleted
                )
                SELECT :id, :user_id, :title, :message, :type, 'seed', :is_read, :created_at, false
                WHERE NOT EXISTS (
                    SELECT 1 FROM notifications WHERE id = :id
                )
                """
            ),
            {
                "id": nid,
                "user_id": target,
                "title": title,
                "message": message,
                "type": ntype,
                "is_read": is_read,
                "created_at": created,
            },
        )


def main() -> None:
    if not _enabled():
        print("Skip demo seed: SEED_DEMO_DATA is disabled.")
        return

    random.seed(42)

    with engine.begin() as conn:
        marker = conn.execute(
            text("SELECT 1 FROM users WHERE email = :email LIMIT 1"),
            {"email": _MARKER_EMAIL},
        ).fetchone()
        if marker:
            print("Demo data already seeded — skip.")
            return

        print("Seeding demo data (mô phỏng ~3 tháng vận hành)...")

        stages = {}
        platforms = {}
        product_types = {}
        statuses = {}
        for stage in ("Development", "Staging", "Production"):
            sid = _lookup_id(conn, "resource_stages", stage)
            if sid:
                stages[stage] = sid
        for platform in ("Android", "Windows", "Linux", "macOS", "Web"):
            pid = _lookup_id(conn, "resource_platforms", platform)
            if pid:
                platforms[platform] = pid
        for ptype in ("Mobile App", "Desktop Software", "Document", "Archive", "Media"):
            tid = _lookup_id(conn, "product_types", ptype)
            if tid:
                product_types[ptype] = tid
        for status in ("Pending", "Approved", "Rejected"):
            sid = _lookup_id(conn, "resource_statuss", status)
            if sid:
                statuses[status] = sid

        if not all([stages, platforms, product_types, statuses]):
            print("Skip demo seed: catalog chưa đủ (chạy migration + seed_classification_defaults trước).")
            return

        catalog = {
            "stages": stages,
            "platforms": platforms,
            "product_types": product_types,
            "statuses": statuses,
        }

        password = _cfg("SEED_DEMO_PASSWORD", _DEMO_PASSWORD_DEFAULT)
        password_hash = get_password_hash(password)

        admin_row = conn.execute(
            text("SELECT id FROM users WHERE is_deleted = false ORDER BY created_at LIMIT 1")
        ).fetchone()
        admin_id = admin_row[0] if admin_row else None

        user_ids = _ensure_users(conn, password_hash)
        repo_ids = _ensure_repos(conn, user_ids)
        tag_ids = _ensure_tags(conn, user_ids)
        resource_ids = _ensure_resources(conn, user_ids, repo_ids, tag_ids, catalog)
        _ensure_shares(conn, user_ids, resource_ids)
        _ensure_favorites(conn, user_ids, resource_ids)
        _ensure_bookmarks(conn, user_ids, resource_ids)
        _ensure_search_history(conn, user_ids)
        _ensure_notifications(conn, user_ids, admin_id)

    print("Demo seed OK.")
    print(f"  Demo users password: {_cfg('SEED_DEMO_PASSWORD', _DEMO_PASSWORD_DEFAULT)}")
    print("  Ví dụ đăng nhập: nguyen.van.a@demo.local")


if __name__ == "__main__":
    main()

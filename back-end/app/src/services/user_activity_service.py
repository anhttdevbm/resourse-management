"""Service for user favorites, bookmarks, and history."""
from __future__ import annotations

import os
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import BEErrorCode
from app.src.schemas.user_activity import (
    BookmarkCreate,
    FavoriteCreate,
    SearchHistoryCreate,
)
from app.src.services.user_service import UserService

_user_service = UserService()


def _ensure_can_access_resource(
    db_session: Session, resource_id: uuid.UUID, user_id: uuid.UUID
) -> models.Resource:
    """Prevent IDOR: only allow favorite/bookmark of visible resources."""
    resource = (
        db_session.query(models.Resource)
        .filter(
            models.Resource.id == resource_id,
            models.Resource.is_deleted.is_(False),
        )
        .first()
    )
    if not resource:
        raise BEErrorCode.RESOURCE_NOT_FOUND.value

    if str(resource.user_id) == str(user_id):
        return resource

    user = db_session.query(models.User).filter(models.User.id == user_id).first()
    if user and _user_service._has_admin_access(db_session, user):
        return resource

    status_name = None
    if resource.status_id:
        status = (
            db_session.query(models.ResourceStatus)
            .filter(models.ResourceStatus.id == resource.status_id)
            .first()
        )
        status_name = status.name if status else None
    if status_name == "Approved":
        return resource

    share = (
        db_session.query(models.ResourceShare)
        .filter(
            models.ResourceShare.resource_id == resource.id,
            models.ResourceShare.shared_with_user_id == user_id,
        )
        .first()
    )
    if share:
        return resource

    raise BEErrorCode.USER_NOT_PERMISSION.value


def _normalize_query(query: str) -> str:
    return re.sub(r"\s+", " ", query.strip().lower())


def _resource_snapshot(
    resource: Optional[models.Resource],
    *,
    resource_id: uuid.UUID,
    fallback_name: Optional[str] = None,
    fallback_version: Optional[str] = None,
    fallback_url: Optional[str] = None,
) -> Dict[str, Any]:
    if resource and not resource.is_deleted:
        return {
            "id": str(resource.id),
            "name": resource.name,
            "version": resource.version,
            "url": resource.url,
        }
    return {
        "id": str(resource_id),
        "name": fallback_name or "Unknown",
        "version": fallback_version or "—",
        "url": fallback_url,
    }


def _file_extension(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    base = os.path.basename(url)
    if "." in base:
        return base.rsplit(".", 1)[-1].lower()
    return None


class UserActivityService:
    """Manage per-user favorites, bookmarks, and activity history."""

    def list_favorites(self, db_session: Session, user_id: uuid.UUID) -> List[Dict[str, Any]]:
        rows = (
            db_session.query(models.UserFavorite, models.Resource)
            .outerjoin(models.Resource, models.UserFavorite.resource_id == models.Resource.id)
            .filter(models.UserFavorite.user_id == user_id)
            .order_by(desc(models.UserFavorite.created_at))
            .all()
        )
        items = []
        for fav, resource in rows:
            snap = _resource_snapshot(resource, resource_id=fav.resource_id)
            items.append({**snap, "added_at": fav.created_at.isoformat() if fav.created_at else ""})
        return items

    def add_favorite(
        self, db_session: Session, user_id: uuid.UUID, payload: FavoriteCreate
    ) -> Dict[str, Any]:
        resource_id = uuid.UUID(payload.resource_id)
        resource = _ensure_can_access_resource(db_session, resource_id, user_id)
        existing = (
            db_session.query(models.UserFavorite)
            .filter(
                models.UserFavorite.user_id == user_id,
                models.UserFavorite.resource_id == resource_id,
            )
            .first()
        )
        if existing:
            snap = _resource_snapshot(
                resource,
                resource_id=resource_id,
                fallback_name=payload.name,
                fallback_version=payload.version,
                fallback_url=payload.url,
            )
            return {**snap, "added_at": existing.created_at.isoformat() if existing.created_at else ""}

        fav = models.UserFavorite(user_id=user_id, resource_id=resource_id)
        db_session.add(fav)
        db_session.commit()
        db_session.refresh(fav)
        snap = _resource_snapshot(
            resource,
            resource_id=resource_id,
            fallback_name=payload.name,
            fallback_version=payload.version,
            fallback_url=payload.url,
        )
        return {**snap, "added_at": fav.created_at.isoformat() if fav.created_at else ""}

    def remove_favorite(self, db_session: Session, user_id: uuid.UUID, resource_id: uuid.UUID) -> None:
        row = (
            db_session.query(models.UserFavorite)
            .filter(
                models.UserFavorite.user_id == user_id,
                models.UserFavorite.resource_id == resource_id,
            )
            .first()
        )
        if row:
            db_session.delete(row)
            db_session.commit()

    def clear_favorites(self, db_session: Session, user_id: uuid.UUID) -> int:
        deleted = (
            db_session.query(models.UserFavorite)
            .filter(models.UserFavorite.user_id == user_id)
            .delete(synchronize_session=False)
        )
        db_session.commit()
        return deleted

    def list_bookmarks(self, db_session: Session, user_id: uuid.UUID) -> List[Dict[str, Any]]:
        rows = (
            db_session.query(models.UserBookmark, models.Resource)
            .outerjoin(models.Resource, models.UserBookmark.resource_id == models.Resource.id)
            .filter(models.UserBookmark.user_id == user_id)
            .order_by(desc(models.UserBookmark.created_at))
            .all()
        )
        items = []
        for bookmark, resource in rows:
            snap = _resource_snapshot(resource, resource_id=bookmark.resource_id)
            items.append(
                {
                    **snap,
                    "note": bookmark.note,
                    "bookmarked_at": bookmark.created_at.isoformat() if bookmark.created_at else "",
                }
            )
        return items

    def add_bookmark(
        self, db_session: Session, user_id: uuid.UUID, payload: BookmarkCreate
    ) -> Dict[str, Any]:
        resource_id = uuid.UUID(payload.resource_id)
        resource = _ensure_can_access_resource(db_session, resource_id, user_id)
        existing = (
            db_session.query(models.UserBookmark)
            .filter(
                models.UserBookmark.user_id == user_id,
                models.UserBookmark.resource_id == resource_id,
            )
            .first()
        )
        if existing:
            if payload.note is not None:
                existing.note = payload.note.strip() or None
                db_session.commit()
            snap = _resource_snapshot(
                resource,
                resource_id=resource_id,
                fallback_name=payload.name,
                fallback_version=payload.version,
                fallback_url=payload.url,
            )
            return {
                **snap,
                "note": existing.note,
                "bookmarked_at": existing.created_at.isoformat() if existing.created_at else "",
            }

        bookmark = models.UserBookmark(
            user_id=user_id,
            resource_id=resource_id,
            note=(payload.note.strip() if payload.note else None),
        )
        db_session.add(bookmark)
        db_session.commit()
        db_session.refresh(bookmark)
        snap = _resource_snapshot(
            resource,
            resource_id=resource_id,
            fallback_name=payload.name,
            fallback_version=payload.version,
            fallback_url=payload.url,
        )
        return {
            **snap,
            "note": bookmark.note,
            "bookmarked_at": bookmark.created_at.isoformat() if bookmark.created_at else "",
        }

    def update_bookmark_note(
        self, db_session: Session, user_id: uuid.UUID, resource_id: uuid.UUID, note: Optional[str]
    ) -> Dict[str, Any]:
        row = (
            db_session.query(models.UserBookmark)
            .filter(
                models.UserBookmark.user_id == user_id,
                models.UserBookmark.resource_id == resource_id,
            )
            .first()
        )
        if not row:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        row.note = note.strip() if note else None
        db_session.commit()
        resource = db_session.query(models.Resource).filter(models.Resource.id == resource_id).first()
        snap = _resource_snapshot(resource, resource_id=resource_id)
        return {
            **snap,
            "note": row.note,
            "bookmarked_at": row.created_at.isoformat() if row.created_at else "",
        }

    def remove_bookmark(self, db_session: Session, user_id: uuid.UUID, resource_id: uuid.UUID) -> None:
        row = (
            db_session.query(models.UserBookmark)
            .filter(
                models.UserBookmark.user_id == user_id,
                models.UserBookmark.resource_id == resource_id,
            )
            .first()
        )
        if row:
            db_session.delete(row)
            db_session.commit()

    def clear_bookmarks(self, db_session: Session, user_id: uuid.UUID) -> int:
        deleted = (
            db_session.query(models.UserBookmark)
            .filter(models.UserBookmark.user_id == user_id)
            .delete(synchronize_session=False)
        )
        db_session.commit()
        return deleted

    def list_search_history(self, db_session: Session, user_id: uuid.UUID) -> List[Dict[str, Any]]:
        rows = (
            db_session.query(models.SearchHistory)
            .filter(models.SearchHistory.user_id == user_id)
            .order_by(desc(models.SearchHistory.searched_at))
            .limit(200)
            .all()
        )
        return [
            {
                "id": row.query_key,
                "query": row.query,
                "resource_count": row.resource_count,
                "user_count": row.user_count,
                "searched_at": row.searched_at.isoformat() if row.searched_at else "",
            }
            for row in rows
        ]

    def add_search_history(
        self, db_session: Session, user_id: uuid.UUID, payload: SearchHistoryCreate
    ) -> Dict[str, Any]:
        query = payload.query.strip()
        if len(query) < 2:
            return {
                "id": "",
                "query": query,
                "resource_count": payload.resource_count,
                "user_count": payload.user_count,
                "searched_at": "",
            }
        query_key = _normalize_query(query)
        existing = (
            db_session.query(models.SearchHistory)
            .filter(
                models.SearchHistory.user_id == user_id,
                models.SearchHistory.query_key == query_key,
            )
            .first()
        )
        now = datetime.utcnow()
        if existing:
            existing.query = query
            existing.resource_count = payload.resource_count
            existing.user_count = payload.user_count
            existing.searched_at = now
            db_session.commit()
            row = existing
        else:
            row = models.SearchHistory(
                user_id=user_id,
                query=query,
                query_key=query_key,
                resource_count=payload.resource_count,
                user_count=payload.user_count,
                searched_at=now,
            )
            db_session.add(row)
            db_session.commit()
            db_session.refresh(row)
        return {
            "id": row.query_key,
            "query": row.query,
            "resource_count": row.resource_count,
            "user_count": row.user_count,
            "searched_at": row.searched_at.isoformat() if row.searched_at else "",
        }

    def remove_search_history(self, db_session: Session, user_id: uuid.UUID, query_key: str) -> None:
        row = (
            db_session.query(models.SearchHistory)
            .filter(
                models.SearchHistory.user_id == user_id,
                models.SearchHistory.query_key == query_key,
            )
            .first()
        )
        if row:
            db_session.delete(row)
            db_session.commit()

    def clear_search_history(self, db_session: Session, user_id: uuid.UUID) -> int:
        deleted = (
            db_session.query(models.SearchHistory)
            .filter(models.SearchHistory.user_id == user_id)
            .delete(synchronize_session=False)
        )
        db_session.commit()
        return deleted

    def list_download_history(self, db_session: Session, user_id: uuid.UUID) -> List[Dict[str, Any]]:
        latest = (
            db_session.query(
                models.DownloadLog.resource_id,
                func.max(models.DownloadLog.downloaded_at).label("downloaded_at"),
            )
            .filter(models.DownloadLog.user_id == user_id)
            .group_by(models.DownloadLog.resource_id)
            .subquery()
        )
        rows = (
            db_session.query(models.Resource, latest.c.downloaded_at)
            .join(latest, models.Resource.id == latest.c.resource_id)
            .filter(models.Resource.is_deleted.is_(False))
            .order_by(desc(latest.c.downloaded_at))
            .all()
        )
        items = []
        for resource, downloaded_at in rows:
            items.append(
                {
                    "id": str(resource.id),
                    "name": resource.name,
                    "version": resource.version,
                    "url": resource.url,
                    "downloaded_at": downloaded_at.isoformat() if downloaded_at else "",
                    "extension": _file_extension(resource.url),
                }
            )
        return items

    def list_upload_history(self, db_session: Session, user_id: uuid.UUID) -> List[Dict[str, Any]]:
        rows = (
            db_session.query(models.Resource)
            .filter(models.Resource.user_id == user_id, models.Resource.is_deleted.is_(False))
            .order_by(desc(models.Resource.created_at))
            .limit(500)
            .all()
        )
        return [
            {
                "id": str(resource.id),
                "name": resource.name,
                "version": resource.version,
                "url": resource.url,
                "uploaded_at": resource.created_at.isoformat() if resource.created_at else "",
            }
            for resource in rows
        ]

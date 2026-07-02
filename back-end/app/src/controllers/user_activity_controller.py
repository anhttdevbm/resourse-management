"""User activity endpoints (favorites, bookmarks, history)."""
from typing import Tuple
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.src.models import User
from app.src.schemas.response import ResponseObject
from app.src.schemas.user_activity import (
    BookmarkCreate,
    BookmarkNoteUpdate,
    FavoriteCreate,
    SearchHistoryCreate,
)
from app.src.services.user_activity_service import UserActivityService
from app.src.services.user_service import UserService
from app.src.utils.connection.sql_connection import get_db_session

user_activity_router = APIRouter()
user_activity_service = UserActivityService()
user_service = UserService()


def _user(user_data: Tuple[User, str]) -> User:
    return user_data[0]


@user_activity_router.get("/users/me/favorites")
def list_favorites(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    items = user_activity_service.list_favorites(db_session, _user(current_user).id)
    return ResponseObject(data={"items": items}, code="BE0000")


@user_activity_router.post("/users/me/favorites")
def add_favorite(
    payload: FavoriteCreate,
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    item = user_activity_service.add_favorite(db_session, _user(current_user).id, payload)
    return ResponseObject(data=item, code="BE0000")


@user_activity_router.delete("/users/me/favorites/{resource_id}")
def remove_favorite(
    resource_id: UUID,
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    user_activity_service.remove_favorite(db_session, _user(current_user).id, resource_id)
    return ResponseObject(message="Removed favorite", code="BE0000")


@user_activity_router.delete("/users/me/favorites")
def clear_favorites(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    deleted = user_activity_service.clear_favorites(db_session, _user(current_user).id)
    return ResponseObject(data={"deleted": deleted}, code="BE0000")


@user_activity_router.get("/users/me/bookmarks")
def list_bookmarks(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    items = user_activity_service.list_bookmarks(db_session, _user(current_user).id)
    return ResponseObject(data={"items": items}, code="BE0000")


@user_activity_router.post("/users/me/bookmarks")
def add_bookmark(
    payload: BookmarkCreate,
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    item = user_activity_service.add_bookmark(db_session, _user(current_user).id, payload)
    return ResponseObject(data=item, code="BE0000")


@user_activity_router.patch("/users/me/bookmarks/{resource_id}")
def update_bookmark_note(
    resource_id: UUID,
    payload: BookmarkNoteUpdate,
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    item = user_activity_service.update_bookmark_note(
        db_session, _user(current_user).id, resource_id, payload.note
    )
    return ResponseObject(data=item, code="BE0000")


@user_activity_router.delete("/users/me/bookmarks/{resource_id}")
def remove_bookmark(
    resource_id: UUID,
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    user_activity_service.remove_bookmark(db_session, _user(current_user).id, resource_id)
    return ResponseObject(message="Removed bookmark", code="BE0000")


@user_activity_router.delete("/users/me/bookmarks")
def clear_bookmarks(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    deleted = user_activity_service.clear_bookmarks(db_session, _user(current_user).id)
    return ResponseObject(data={"deleted": deleted}, code="BE0000")


@user_activity_router.get("/users/me/search-history")
def list_search_history(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    items = user_activity_service.list_search_history(db_session, _user(current_user).id)
    return ResponseObject(data={"items": items}, code="BE0000")


@user_activity_router.post("/users/me/search-history")
def add_search_history(
    payload: SearchHistoryCreate,
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    item = user_activity_service.add_search_history(db_session, _user(current_user).id, payload)
    return ResponseObject(data=item, code="BE0000")


@user_activity_router.delete("/users/me/search-history/{query_key}")
def remove_search_history(
    query_key: str,
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    user_activity_service.remove_search_history(db_session, _user(current_user).id, query_key)
    return ResponseObject(message="Removed search history", code="BE0000")


@user_activity_router.delete("/users/me/search-history")
def clear_search_history(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    deleted = user_activity_service.clear_search_history(db_session, _user(current_user).id)
    return ResponseObject(data={"deleted": deleted}, code="BE0000")


@user_activity_router.get("/users/me/download-history")
def list_download_history(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    items = user_activity_service.list_download_history(db_session, _user(current_user).id)
    return ResponseObject(data={"items": items}, code="BE0000")


@user_activity_router.get("/users/me/upload-history")
def list_upload_history(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    items = user_activity_service.list_upload_history(db_session, _user(current_user).id)
    return ResponseObject(data={"items": items}, code="BE0000")

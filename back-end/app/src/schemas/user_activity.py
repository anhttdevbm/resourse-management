"""Schemas for user activity (favorites, bookmarks, history)."""
from typing import List, Optional

from pydantic import BaseModel, Field


class ResourceActivityItem(BaseModel):
    id: str
    name: str
    version: str
    url: Optional[str] = None


class FavoriteCreate(BaseModel):
    resource_id: str
    name: Optional[str] = None
    version: Optional[str] = None
    url: Optional[str] = None


class FavoriteItem(ResourceActivityItem):
    added_at: str


class BookmarkCreate(BaseModel):
    resource_id: str
    name: Optional[str] = None
    version: Optional[str] = None
    url: Optional[str] = None
    note: Optional[str] = None


class BookmarkNoteUpdate(BaseModel):
    note: Optional[str] = None


class BookmarkItem(ResourceActivityItem):
    note: Optional[str] = None
    bookmarked_at: str


class SearchHistoryCreate(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    resource_count: int = 0
    user_count: int = 0


class SearchHistoryItem(BaseModel):
    id: str
    query: str
    resource_count: int
    user_count: int
    searched_at: str


class DownloadHistoryItem(ResourceActivityItem):
    downloaded_at: str
    extension: Optional[str] = None


class UploadHistoryItem(ResourceActivityItem):
    uploaded_at: str


class ActivityListResponse(BaseModel):
    items: List

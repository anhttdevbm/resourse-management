"""Define resource schemas."""
from datetime import datetime
from typing import Any, Optional

from fastapi import Form, UploadFile
from pydantic import BaseModel


class ResourceCreate(BaseModel):
    """Define resource create."""
    stage_id: Optional[str] = Form(None)
    status_id: Optional[str] = Form(None)
    name: str = Form(...)
    version: str = Form(...)
    platform_id: Optional[str] = Form(None)
    product_type_id: Optional[str] = Form(None)
    repo_id: Optional[str] = Form(None)
    tag_id: Optional[str] = Form(None)
    class Config:
        from_attributes = True


class ResourceUpdate(BaseModel):
    """Define resource update."""

    stage_id: Optional[str] = None
    status_id: Optional[str] = None
    name: Optional[str] = None
    version: Optional[str] = None
    platform_id: Optional[str] = None
    product_type_id: Optional[str] = None
    repo_id: Optional[str] = None
    tag_id: Optional[str] = None
    user_id: Optional[str] = None
    key: Optional[str] = None


class ResourceGet(BaseModel):
    """Define resource get."""

    id: Optional[str] = None
    stage_id: Optional[str] = None
    status_id: Optional[str] = None
    name: Optional[str] = None
    version: Optional[str] = None
    platform_id: Optional[str] = None
    product_type_id: Optional[str] = None
    repo_id: Optional[str] = None
    tag_id: Optional[str] = None
    q: Optional[str] = None  # free-text: khớp name hoặc version


class ResourceDB(ResourceCreate):
    """Define resource DB."""

    id: Any # noqa
    created_at: datetime

    class Config:
        """Define config."""

        orm_mode = True


class ResourceInfoCreate(BaseModel):
    """Define Resource info create."""

    name: str


class ResourceInfoUpdate(ResourceInfoCreate):
    """Define resource info update."""

    name: str


class ResourceInfo(ResourceInfoCreate):
    """Define resource info."""

    id: Any # noqa

    class Config:
        """Define config."""

        orm_mode = True


class ResourceFileUpload(BaseModel):
    """Define resource file upload."""

    file: UploadFile
    folder: Optional[str] = "uploads"
    object_name: Optional[str] = None
    additional_property: Optional[str] = None
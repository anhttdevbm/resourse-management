"""Schemas for resource sharing."""

from pydantic import BaseModel, EmailStr
from typing import Optional


class ResourceShareCreate(BaseModel):
    """Payload to create/update a share for a resource."""

    email: EmailStr
    can_edit: bool = False


class ResourceShareInfo(BaseModel):
    """Share info returned to clients."""

    id: str
    user_id: str
    email: str
    name: Optional[str]
    can_edit: bool
    created_at: str


"""Define permission schema file."""

from pydantic import BaseModel, Field


class PermissionCreate(BaseModel):
    """Define  input schema to create permission."""

    name: str = Field(..., min_length=1, max_length=120)


class PermissionUpdate(BaseModel):
    """Define Permission input schema to update permission."""

    name: str = Field(..., min_length=1, max_length=120)
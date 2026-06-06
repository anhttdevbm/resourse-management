"""Define permission schema file."""

from pydantic import BaseModel


class PermissionCreate(BaseModel):
    """Define  input schema to create permission."""

    name: str


class PermissionUpdate(PermissionCreate):
    """Define Permission input schema to update permission."""
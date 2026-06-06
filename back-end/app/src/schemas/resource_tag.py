"""Define resource tag schemas."""
from pydantic import BaseModel


class ResourceTagBase(BaseModel):
    """Base schema for Resource Tag."""

    name: str


class ResourceTagCreate(ResourceTagBase):
    """Schema for creating Resource Tag."""
    name: str

    pass


class ResourceTagUpdate(ResourceTagBase):
    """Schema for updating Resource Tag."""

    pass
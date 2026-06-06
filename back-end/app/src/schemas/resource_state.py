"""Define resource stage schemas."""
from pydantic import BaseModel


class ResourceStageBase(BaseModel):
    """Base schema for Resource Stage."""

    name: str


class ResourceStageCreate(ResourceStageBase):
    """Schema for creating Role."""

    pass


class ResourceStageUpdate(ResourceStageBase):
    """Schema for updating Role."""

    pass
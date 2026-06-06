"""Define resource platform schemas."""
from pydantic import BaseModel

class ResourcePlatformBase(BaseModel):
    """Base schema for Resource Platform."""

    name: str


class ResourcePlatformCreate(ResourcePlatformBase):
    """Schema for creating reasource platfrom."""

    pass


class ResourcePlatformUpdate(ResourcePlatformBase):
    """Schema for reasource platfrom."""

    pass
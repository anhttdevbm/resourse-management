"""Define resource status schemas."""
from pydantic import BaseModel

class ResourceStatusBase(BaseModel):
    """Base schema for Resource Status."""
    name: str

class ResourceStatusCreate(ResourceStatusBase):
    """Schema for creating Resource Status."""
    name: str
    pass

class ResourceStatusUpdate(ResourceStatusBase):
    """Schema for updating Resource Status."""
    pass
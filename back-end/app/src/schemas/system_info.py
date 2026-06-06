"""Define system info schemas."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class SystemInfoBase(BaseModel):
    system_name: str
    status: str
    version: str

class SystemInfoCreate(SystemInfoBase):
    pass

class SystemInfoUpdate(BaseModel):
    system_name: Optional[str] = None
    status: Optional[str] = None
    version: Optional[str] = None

class SystemInfoResponse(SystemInfoBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

"""Statistics models."""
from pydantic import BaseModel
from typing import Optional


class StatisticsResponse(BaseModel):
    """Statistics response model."""
    total_resources: int
    total_uploads: int
    total_users: int
    total_file_types: int
    
    class Config:
        """Pydantic config."""
        from_attributes = True

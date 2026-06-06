"""Define system info model."""
import uuid
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.src.utils.common import generate_uuid
from .base_model import Base

class SystemInfo(Base):
    """Define system info model."""
    __tablename__ = "system_info"
    
    id: uuid.UUID = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)
    system_name = Column(String, nullable=False, default="Hệ thống")
    status = Column(String, nullable=False, default="Online")  # Online, Offline, Maintenance
    version = Column(String, nullable=False, default="v1.0.0")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.current_timestamp(), nullable=False)

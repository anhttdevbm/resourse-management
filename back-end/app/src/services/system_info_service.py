"""Define system info service."""
from sqlalchemy.orm import Session
from app.src.models.system_info import SystemInfo
from app.src.schemas.system_info import SystemInfoCreate, SystemInfoUpdate
from app.src.exceptions.error_code import BEErrorCode
from typing import Optional

class SystemInfoService:
    """Define SystemInfo service object."""
    
    def __init__(self):
        self.model = SystemInfo
    
    def get_system_info(self, db_session: Session) -> Optional[SystemInfo]:
        """Get system info (should only be one record)."""
        # Get the first record and limit to 1 to ensure we only get one
        result = db_session.query(self.model).limit(1).first()
        print(f"🔍 Backend Debug - get_system_info result: {result}")
        print(f"🔍 Backend Debug - get_system_info type: {type(result)}")
        return result
    
    def create_system_info(self, db_session: Session, system_info: SystemInfoCreate) -> SystemInfo:
        """Create system info."""
        # Check if system info already exists
        existing = self.get_system_info(db_session)
        if existing:
            raise BEErrorCode.DATA_EXISTED.value("System info already exists")
        
        db_system_info = self.model(**system_info.dict())
        db_session.add(db_system_info)
        db_session.commit()
        db_session.refresh(db_system_info)
        return db_system_info
    
    def update_system_info(self, db_session: Session, system_info_update: SystemInfoUpdate) -> SystemInfo:
        """Update system info."""
        system_info = self.get_system_info(db_session)
        if not system_info:
            raise BEErrorCode.DATA_NOT_FOUND.value("System info not found")
        
        update_data = system_info_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(system_info, field, value)
        
        db_session.commit()
        db_session.refresh(system_info)
        return system_info
    
    def get_or_create_system_info(self, db_session: Session) -> SystemInfo:
        """Get or create system info if not exists."""
        system_info = self.get_system_info(db_session)
        if not system_info:
            # Create default system info
            default_info = SystemInfoCreate(
                system_name="Hệ thống",
                status="Online",
                version="v1.0.0"
            )
            system_info = self.create_system_info(db_session, default_info)
        
        print(f"🔍 Backend Debug - System Info object: {system_info}")
        print(f"🔍 Backend Debug - Type: {type(system_info)}")
        return system_info

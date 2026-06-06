"""Define resource platform service file."""
import uuid
from typing import Any, Dict
from sqlalchemy.orm import Session
from app.src import models
from app.src.exceptions.error_code import BEErrorCode
from app.src.repositories.resource_platform import ResourcePlatformRepository
from app.src.schemas.resource_platform import ResourcePlatformCreate, ResourcePlatformUpdate


class ResourcePlatformService(object):
    """Define Resource Platform service object."""

    def __init__(self) -> None:
        """Define constructor for Resource Platform service object."""
        self.resource_platform_repository = ResourcePlatformRepository(models.ResourcePlatform)

    def get(self, db_session: Session, resource_platform_id: uuid.UUID) -> models.ResourcePlatform:
        """Define remove Resource Platform method."""
        resource_platform = self.resource_platform_repository.get(db_session, resource_platform_id)
        if not resource_platform:
            raise BEErrorCode.RESOURCE_PLATFORM_NOT_FOUND.value
        return resource_platform

    def delete(self, db_session: Session, resource_platform_id: uuid.UUID) -> None:
        """Define remove Resource Platform method."""
        resource_platform = self.resource_platform_repository.get(db_session, resource_platform_id)
        if not resource_platform:
            raise BEErrorCode.RESOURCE_PLATFORM_NOT_FOUND.value
        self.resource_platform_repository.delete(db_session, obj_id=resource_platform.id)

    def get_all(self, db_session: Session) -> Dict[str, Any]:
        """Retrieve all Resource Platforms."""
        resource_platforms = self.resource_platform_repository.get_all(db_session)
        if not resource_platforms:
            return {}
        data = {}
        for resource_platform in resource_platforms:
            resource_platform_dict = resource_platform.__dict__.copy() 
            resource_platform_dict.pop('_sa_instance_state', None)
            resource_platform_dict['id'] = str(resource_platform_dict['id']) 
            resource_platform_dict['name'] = resource_platform_dict['name'].format() 
            resource_platform_dict['created_at'] = resource_platform_dict['created_at'].isoformat() 
            resource_platform_dict['updated_at'] = resource_platform_dict['updated_at'].isoformat()
            data[resource_platform_dict['id']] = resource_platform_dict
        return data

    def update(self, db_session: Session, resource_platform_id: int, resource_platform_update: ResourcePlatformUpdate) \
            -> models.ResourcePlatform:
        """Update an existing Resource Platform."""
        if self.resource_platform_repository.get(db_session, resource_platform_id) is None:
            raise BEErrorCode.RESOURCE_PLATFORM_NOT_FOUND.value
        _ = self.resource_platform_repository.update(db_session, obj_id=resource_platform_id, obj_in=resource_platform_update)
        resource_platform = self.resource_platform_repository.get(db_session, resource_platform_id)
        if not resource_platform:
            raise BEErrorCode.RESOURCE_PLATFORM_NOT_FOUND.value
        return resource_platform

    def create(self, db_session: Session, resource_platform_create: ResourcePlatformCreate) -> models.ResourcePlatform:
        """Create a new Resource Platform."""
        resource_platform = self.resource_platform_repository.get_resource_form_by_name(db_session, resource_platform_create.name)
        if resource_platform:
            raise BEErrorCode.RESOURCE_PLATFORM_NOT_FOUND.value
        resource_platform = self.resource_platform_repository.create(db_session, obj_in=resource_platform_create)
        return resource_platform

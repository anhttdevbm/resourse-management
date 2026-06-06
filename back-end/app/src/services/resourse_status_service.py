"""Define Resource Status service file."""
import uuid
from typing import Any, Dict
from sqlalchemy.orm import Session
from app.src import models
from app.src.exceptions.error_code import BEErrorCode
from app.src.repositories.resourse_status import ResourceStatusRepository
from app.src.schemas.resourse_status import ResourceStatusUpdate, ResourceStatusCreate  # noqa

class ResourceStatusService(object):
    """Define Resource Status service object."""

    def __init__(self) -> None:
        """Define constructor for Resource Status service object."""
        self.resource_status_repository = ResourceStatusRepository(models.ResourceStatus)

    def get(self, db_session: Session, resource_status_id: uuid.UUID) -> models.ResourceStatus:
        """Define remove Resource Status method."""
        resource_status = self.resource_status_repository.get(db_session, resource_status_id)
        if not resource_status:
            raise BEErrorCode.RESOURCE_STATUS_NOT_FOUND.value
        return resource_status

    def delete(self, db_session: Session, resource_status_id: uuid.UUID) -> None:
        """Define remove resource status method."""
        resource_status = self.resource_status_repository.get(db_session, resource_status_id)
        if not resource_status:
            raise BEErrorCode.RESOURCE_STATUS_NOT_FOUND.value
        self.resource_status_repository.delete(db_session, obj_id=resource_status.id)

    def get_all(self, db_session: Session) -> Dict[str, Any]:
        """Retrieve all resource statuss."""
        resource_statuss = self.resource_status_repository.get_all(db_session)
        if not resource_statuss:
            raise BEErrorCode.RESOURCE_STATUS_NOT_FOUND.value
        data = {}
        for resource_status in resource_statuss:
            resource_status_dict = resource_status.__dict__.copy() 
            resource_status_dict.pop('_sa_instance_state', None)
            resource_status_dict['id'] = str(resource_status_dict['id'])
            resource_status_dict['name'] = resource_status_dict['name'].format() 
            resource_status_dict['created_at'] = resource_status_dict['created_at'].isoformat() 
            resource_status_dict['updated_at'] = resource_status_dict['updated_at'].isoformat()
            data[resource_status_dict['id']] = resource_status_dict
        return data

    def update(self, db_session: Session, resource_status_id: str, resource_status_update: ResourceStatusUpdate) \
            -> models.ResourceStatus:
        """Update an existing resource status."""
        if self.resource_status_repository.get(db_session, resource_status_id) is None:
            raise BEErrorCode.RESOURCE_STATUS_NOT_FOUND.value
        _ = self.resource_status_repository.update(db_session, obj_id=resource_status_id, obj_in=resource_status_update)
        resource_status = self.resource_status_repository.get(db_session, resource_status_id)
        if not resource_status:
            raise BEErrorCode.RESOURCE_STATUS_NOT_FOUND.value
        return resource_status

    def create(self, db_session: Session, resource_status_create: ResourceStatusCreate) -> models.resource_status:
        """Create a new resource status."""
        resource_status = self.resource_status_repository.get_resource_status_by_name(db_session, resource_status_create.name)
        if resource_status:
            raise BEErrorCode.RESOURCE_STATUS_EXITED.value
        resource_status = self.resource_status_repository.create(db_session, obj_in=resource_status_create)
        return resource_status
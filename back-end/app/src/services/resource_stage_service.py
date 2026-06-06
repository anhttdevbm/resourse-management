"""Define user service file."""
import uuid
from typing import Any, Dict

import decouple
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import BEErrorCode
from app.src.repositories.resource_stage import ResourceStageRepository
from app.src.schemas.resource_state import ResourceStageCreate, ResourceStageUpdate

ACCESS_TOKEN_EXPIRE_MINUTES = decouple.config("ACCESS_TOKEN_EXPIRE_MINUTES")
REFRESH_TOKEN_EXPIRE_MINUTES = decouple.config("REFRESH_TOKEN_EXPIRE_MINUTES")

reusable_oauth2 = HTTPBearer(scheme_name='Authorization')


class ResourceStageService(object):
    """Define Resource Stage service object."""

    def __init__(self) -> None:
        """Define constructor for Resource Stage service object."""
        self.resource_stage_repository = ResourceStageRepository(models.ResourceStage)

    def get(self, db_session: Session, resource_stage_id: uuid.UUID) -> models.ResourceStage:
        """Define remove Resource Stage method."""
        resource_stage = self.resource_stage_repository.get(db_session, resource_stage_id)
        if not resource_stage:
            raise BEErrorCode.RESOURCE_STAGE_NOT_FOUND.value
        return resource_stage

    def delete(self, db_session: Session, resource_stage_id: uuid.UUID) -> None:
        """Define remove resource stage method."""
        resource_stage = self.resource_stage_repository.get(db_session, resource_stage_id)
        if not resource_stage:
            raise BEErrorCode.RESOURCE_STAGE_NOT_FOUND.value
        self.resource_stage_repository.delete(db_session, obj_id=resource_stage.id)

    def get_all(self, db_session: Session) -> Dict[str, Any]:
        """Retrieve all resource stages."""
        resource_stages = self.resource_stage_repository.get_all(db_session)
        if not resource_stages:
            return {}
        data = {}
        for resource_stage in resource_stages:
            resource_stage_dict = resource_stage.__dict__.copy() 
            resource_stage_dict.pop('_sa_instance_state', None)
        
            resource_stage_dict['id'] = str(resource_stage_dict['id']) 
            resource_stage_dict['name'] = resource_stage_dict['name'].format() 
            resource_stage_dict['created_at'] = resource_stage_dict['created_at'].isoformat() 
            resource_stage_dict['updated_at'] = resource_stage_dict['updated_at'].isoformat()
            data[resource_stage_dict['id']] = resource_stage_dict
        return data

    def update(self, db_session: Session, resource_stage_id: int, resource_stage_update: ResourceStageUpdate) \
            -> models.ResourceStage:
        """Update an existing resource stage."""
        if self.resource_stage_repository.get(db_session, resource_stage_id) is None:
            raise BEErrorCode.RESOURCE_STAGE_NOT_FOUND.value
        _ = self.resource_stage_repository.update(db_session, obj_id=resource_stage_id, obj_in=resource_stage_update)
        resource_stage = self.resource_stage_repository.get(db_session, resource_stage_id)
        if not resource_stage:
            raise BEErrorCode.RESOURCE_STAGE_NOT_FOUND.value
        return resource_stage

    def create(self, db_session: Session, resource_stage_create: ResourceStageCreate) -> models.resource_stage:
        """Create a new resource stage."""
        resource_tag = self.resource_stage_repository.get_resource_stage_by_name(db_session, resource_stage_create.name)
        if resource_tag:
            raise BEErrorCode.RESOURCE_TAG_EXITED
        resource_stage = self.resource_stage_repository.create(db_session, obj_in=resource_stage_create)
        return resource_stage

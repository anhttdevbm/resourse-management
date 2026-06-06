"""Define resource platform controller."""
from typing import Tuple
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.src.controllers.auth_controller import user_service
from app.src.models import User
from app.src.schemas.resource_platform import ResourcePlatformCreate, ResourcePlatformUpdate
from app.src.schemas.response import ResponseObject
from app.src.services.resource_platform_service import ResourcePlatformService
from app.src.utils.common import row2dict
from app.src.utils.connection.sql_connection import get_db_session
resource_form_service = ResourcePlatformService()
resource_forms_routers = APIRouter()

@resource_forms_routers.put("/resource_platforms/{resource_platform_id}")
def update_resource_platform(resource_platform_id: str, resource_platform_update: ResourcePlatformUpdate, db_session: Session = Depends(get_db_session) # noqa
                          , _: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Update an existing resource platform."""
    data = resource_form_service.update(db_session, resource_platform_id, resource_platform_update)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_forms_routers.get("/resource_platforms")
def read_resource_flatforms(db_session: Session = Depends(get_db_session) # noqa
                            , _: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Get all resource platform."""
    data = resource_form_service.get_all(db_session)
    return ResponseObject(data=data, code="BE0000")


@resource_forms_routers.get("/resource_platforms/")
def read_resource_platform_by_id(resource_platform_id: str, db_session: Session = Depends(get_db_session),
                                 _: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Get resource platform by id."""
    data = resource_form_service.get(db_session, resource_platform_id)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_forms_routers.post("/resource_platforms")
def create_resource_flatform(resource_platform_create: ResourcePlatformCreate, db_session: Session = Depends(get_db_session),
                             _: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Define creat a resource platform."""
    data = resource_form_service.create(db_session, resource_platform_create)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_forms_routers.delete('/resource_platforms/')
def delete_resource_platform(resource_platform_id: str, db_session: Session = Depends(get_db_session),
                          _: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Delete a resource platform."""
    resource_form_service.delete(db_session, resource_platform_id)
    return ResponseObject(message="Delete Resource Platform Success", code="BE0000")
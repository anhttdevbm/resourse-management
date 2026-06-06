"""Define resource tag controller."""
from typing import Tuple
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.src.controllers.auth_controller import user_service
from app.src.models import User
from app.src.schemas.resource_tag import ResourceTagCreate, ResourceTagUpdate
from app.src.schemas.response import ResponseObject
from app.src.services.resource_tag_service import ResourceTagService
from app.src.utils.common import row2dict
from app.src.utils.connection.sql_connection import get_db_session

resource_tag_service = ResourceTagService()

resource_tags_routers = APIRouter()


@resource_tags_routers.get("/resource_tags")
def read_resource_tags(db_session: Session = Depends(get_db_session), # noqa
                       user: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Lấy tất cả thẻ của user hiện tại."""
    data = resource_tag_service.get_all(db_session, user[0].id)
    return ResponseObject(data=data, code="BE0000")


@resource_tags_routers.post("/resource_tags")
def create_resource_tag(resource_tag_create: ResourceTagCreate, db_session: Session = Depends(get_db_session),
                        user: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Tạo thẻ mới cho user hiện tại."""
    data = resource_tag_service.create(db_session, resource_tag_create, user[0].id)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_tags_routers.get("/resource_tags/{resource_tag_id}")
def read_resource_tag_by_id(resource_tag_id: str, db_session: Session = Depends(get_db_session),
                            user: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Get resource tag by id (chỉ nếu thuộc user)."""
    data = resource_tag_service.get(db_session, resource_tag_id, user[0].id)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_tags_routers.put("/resource_tags/{resource_tag_id}")
def update_resource_tag(resource_tag_id: str, resource_tag_update: ResourceTagUpdate, db_session: Session = Depends(get_db_session), # noqa
                        user: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Update an existing resource tag (chỉ thẻ của user)."""
    data = resource_tag_service.update(db_session, resource_tag_id, resource_tag_update, user[0].id)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_tags_routers.delete('/resource_tags/{resource_tag_id}')
def delete_resource_tag(resource_tag_id: str, db_session: Session = Depends(get_db_session),
                        user: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Delete a resource tag (chỉ thẻ của user)."""
    resource_tag_service.delete(db_session, resource_tag_id, user[0].id)
    return ResponseObject(message="Delete Resource Tag Success", code="BE0000")
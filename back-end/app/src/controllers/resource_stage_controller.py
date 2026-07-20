"""Define resource stage controller."""
from typing import Tuple

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.src.controllers.auth_controller import user_service
from app.src.models import User
from app.src.schemas.resource_state import ResourceStageCreate, ResourceStageUpdate
from app.src.schemas.response import ResponseObject
from app.src.services.resource_stage_service import ResourceStageService
from app.src.utils.common import row2dict
from app.src.utils.connection.sql_connection import get_db_session
from app.src.utils.deps_permissions import require_manage_catalog

resource_stage_service = ResourceStageService()
resource_stages_routers = APIRouter()


@resource_stages_routers.put("/resource_stages/{resource_stage_id}")
def update_resource_stage(
    resource_stage_id: str,
    resource_stage_update: ResourceStageUpdate,
    db_session: Session = Depends(get_db_session),
    _: User = Depends(require_manage_catalog),
) -> ResponseObject:
    """Update an existing resource stage."""
    data = resource_stage_service.update(db_session, resource_stage_id, resource_stage_update)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_stages_routers.get("/resource_stages")
def read_resource_stages(
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Get all resource stage."""
    data = resource_stage_service.get_all(db_session)
    return ResponseObject(data=data, code="BE0000")


@resource_stages_routers.get("/resource_stages/{resource_stage_id}")
def read_resource_stage_by_id(
    resource_stage_id: str,
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Get resource stage by id."""
    data = resource_stage_service.get(db_session, resource_stage_id)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_stages_routers.post("/resource_stages")
def create_resource_stage(
    resource_stage_create: ResourceStageCreate,
    db_session: Session = Depends(get_db_session),
    _: User = Depends(require_manage_catalog),
) -> ResponseObject:
    """Create a resource stage."""
    data = resource_stage_service.create(db_session, resource_stage_create)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_stages_routers.delete("/resource_stages/{resource_stage_id}")
def delete_resource_stage(
    resource_stage_id: str,
    db_session: Session = Depends(get_db_session),
    _: User = Depends(require_manage_catalog),
) -> ResponseObject:
    """Delete a resource stage."""
    resource_stage_service.delete(db_session, resource_stage_id)
    return ResponseObject(message="Delete Resource Stage Success", code="BE0000")

"""Define resource status controller."""
from typing import Tuple

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.src.controllers.auth_controller import user_service
from app.src.models import User
from app.src.schemas.response import ResponseObject
from app.src.schemas.resourse_status import ResourceStatusCreate, ResourceStatusUpdate
from app.src.services.resourse_status_service import ResourceStatusService
from app.src.utils.common import row2dict
from app.src.utils.connection.sql_connection import get_db_session
from app.src.utils.deps_permissions import require_manage_catalog

resource_status_service = ResourceStatusService()
resource_statuss_routers = APIRouter()


@resource_statuss_routers.put("/resource_statuss/{resource_status_id}")
def update_resource_status(
    resource_status_id: str,
    resource_status_update: ResourceStatusUpdate,
    db_session: Session = Depends(get_db_session),
    _: User = Depends(require_manage_catalog),
) -> ResponseObject:
    """Update an existing resource status."""
    data = resource_status_service.update(db_session, resource_status_id, resource_status_update)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_statuss_routers.get("/resource_statuss")
def read_resource_statuss(
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Get all resource statuses."""
    data = resource_status_service.get_all(db_session)
    return ResponseObject(data=data, code="BE0000")


@resource_statuss_routers.get("/resource_statuss/{resource_status_id}")
def read_resource_status_by_id(
    resource_status_id: str,
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Get resource status by id."""
    data = resource_status_service.get(db_session, resource_status_id)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_statuss_routers.post("/resource_status")
def create_resource_status(
    resource_status_create: ResourceStatusCreate,
    db_session: Session = Depends(get_db_session),
    _: User = Depends(require_manage_catalog),
) -> ResponseObject:
    """Create a resource status."""
    data = resource_status_service.create(db_session, resource_status_create)
    return ResponseObject(data=row2dict(data), code="BE0000")


@resource_statuss_routers.delete("/resource_statuss/{resource_status_id}")
def delete_resource_status(
    resource_status_id: str,
    db_session: Session = Depends(get_db_session),
    _: User = Depends(require_manage_catalog),
) -> ResponseObject:
    """Delete a resource status."""
    resource_status_service.delete(db_session, resource_status_id)
    return ResponseObject(message="Delete Resource Status Success", code="BE0000")

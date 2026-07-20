"""Define product type controller."""
from typing import Tuple

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.src.controllers.auth_controller import user_service
from app.src.models import User
from app.src.schemas.product_type import ProductTypeCreate, ProductTypeUpdate
from app.src.schemas.response import ResponseObject
from app.src.services.product_type_service import ProductTypeService
from app.src.utils.common import row2dict
from app.src.utils.connection.sql_connection import get_db_session
from app.src.utils.deps_permissions import require_manage_catalog

produce_type_service = ProductTypeService()
produce_types_routers = APIRouter()


@produce_types_routers.put("/produce_types/{produce_type_id}")
def update_produce_type(
    produce_type_id: str,
    produce_type_update: ProductTypeUpdate,
    db_session: Session = Depends(get_db_session),
    _: User = Depends(require_manage_catalog),
) -> ResponseObject:
    """Update an existing product type."""
    data = produce_type_service.update(db_session, produce_type_id, produce_type_update)
    return ResponseObject(data=row2dict(data), code="BE0000")


@produce_types_routers.get("/produce_types")
def read_produce_types(
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Get all product types."""
    data = produce_type_service.get_all(db_session)
    return ResponseObject(data=data, code="BE0000")


@produce_types_routers.get("/produce_types/{produce_type_id}")
def read_produce_type_by_id(
    produce_type_id: str,
    db_session: Session = Depends(get_db_session),
    _: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Get product type by id."""
    data = produce_type_service.get(db_session, produce_type_id)
    return ResponseObject(data=row2dict(data), code="BE0000")


@produce_types_routers.post("/produce_types")
def create_produce_type(
    produce_type_create: ProductTypeCreate,
    db_session: Session = Depends(get_db_session),
    _: User = Depends(require_manage_catalog),
) -> ResponseObject:
    """Create a product type."""
    data = produce_type_service.create(db_session, produce_type_create)
    return ResponseObject(data=row2dict(data), code="BE0000")


@produce_types_routers.delete("/produce_types/{produce_type_id}")
def delete_produce_type(
    produce_type_id: str,
    db_session: Session = Depends(get_db_session),
    _: User = Depends(require_manage_catalog),
) -> ResponseObject:
    """Delete a product type."""
    produce_type_service.delete(db_session, produce_type_id)
    return ResponseObject(message="Delete Product Type Success", code="BE0000")

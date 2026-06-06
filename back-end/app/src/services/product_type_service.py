"""Define product type service file."""
import uuid
from typing import Any, Dict
from sqlalchemy.orm import Session
from app.src import models
from app.src.exceptions.error_code import BEErrorCode
from app.src.repositories.product_type import ProductTypeRepository
from app.src.schemas.product_type import ProductTypeCreate, ProductTypeUpdate


class ProductTypeService(object):
    """Define Product Type service object."""

    def __init__(self) -> None:
        """Define constructor for Product Type service object."""
        self.producy_type_repository = ProductTypeRepository(models.ProductType)

    def get(self, db_session: Session, product_type_id: uuid.UUID) -> models.ProductType:
        """Define remove Product Type method."""
        product_type = self.producy_type_repository.get(db_session, product_type_id)
        if not product_type:
            raise BEErrorCode.RESOURCE_STAGE_NOT_FOUND.value
        return product_type

    def delete(self, db_session: Session, produce_type_id: uuid.UUID) -> None:
        """Define remove produce type method."""
        product_type = self.producy_type_repository.get(db_session, produce_type_id)
        if not product_type:
            raise BEErrorCode.PRODUCE_NOT_FOUND.value
        self.producy_type_repository.delete(db_session, obj_id=product_type.id)

    def get_all(self, db_session: Session) -> Dict[str, Any]:
        """Retrieve all produce types."""
        produce_types = self.producy_type_repository.get_all(db_session)
        if not produce_types:
            return {}
        data = {}
        for produce_type in produce_types:
            produce_type_dict = produce_type.__dict__.copy() 
            produce_type_dict.pop('_sa_instance_state', None)
            produce_type_dict['id'] = str(produce_type_dict['id']) 
            produce_type_dict['name'] = produce_type_dict['name'].format() 
            produce_type_dict['created_at'] = produce_type_dict['created_at'].isoformat() 
            produce_type_dict['updated_at'] = produce_type_dict['updated_at'].isoformat()
            data[produce_type_dict['id']] = produce_type_dict
        return data

    def update(self, db_session: Session, produce_type_id: int, produce_type_update: ProductTypeUpdate) \
            -> models.ProductType:
        """Update an existing produce type."""
        if self.producy_type_repository.get(db_session, produce_type_id) is None:
            raise BEErrorCode.PRODUCE_NOT_FOUND.value
        _ = self.producy_type_repository.update(db_session, obj_id=produce_type_id, obj_in=produce_type_update)
        produce_type = self.producy_type_repository.get(db_session, produce_type_id)
        if not produce_type:
            raise BEErrorCode.PRODUCE_NOT_FOUND.value
        return produce_type

    def create(self, db_session: Session, produce_type_create: ProductTypeCreate) -> models.ProductType:
        """Create a new resource stage."""
        produce_type = self.producy_type_repository.get_product_type_by_name(db_session, produce_type_create.name)
        if produce_type:
            raise BEErrorCode.PRODUCE_TYPE_EXITED.value
        product_type = self.producy_type_repository.create(db_session, obj_in=produce_type_create)
        return product_type

"""doc."""
import logging
import uuid
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.src.exceptions.error_code import ServerErrorCode
from app.src.models.base_model import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)



class BaseSQLRepository(Generic[ModelType]):
    """Define BaseSQL repository object."""

    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).

        **Parameters**

        * `model`: A SQLAlchemy model class
        * `schema`: A Pydantic model (schema) class
        """
        self.model = model

    def get(self, session: Session, obj_id: Any) -> Optional[ModelType]:
        """Define method get data by query id."""
        try:
            data = session.query(self.model).filter(self.model.id == obj_id,
                                                    self.model.is_deleted.is_(False)).first()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        logging.debug(f"Get id: {obj_id} from table {self.model.__tablename__.upper()} done")
        return data

    def get_all(self, session: Session) -> List[ModelType]:
        """Define method get all data."""
        try:
            data = session.query(self.model).filter(self.model.is_deleted.is_(False)).all()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        logging.debug(f"Get all objects from table {self.model.__tablename__.upper()} done")
        return data

    def create(self, session: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """Define method create base for repository."""
        try:
            obj_in_data = jsonable_encoder(obj_in)
            db_obj = self.model(**obj_in_data)  # type: ignore
            session.add(db_obj)
            session.commit()
            session.refresh(db_obj)
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        logging.debug(f"Insert {db_obj} to table {self.model.__tablename__.upper()} done")
        return db_obj

    def update(
            self,
            session: Session,
            *,
            obj_id: uuid.UUID,
            obj_in: Union[UpdateSchemaType, Dict[str, Any]],
    ) -> Union[UpdateSchemaType, Dict[str, Any]]:
        """Define method update base for repository."""
        try:
            if isinstance(obj_in, dict):
                update_data = obj_in
            else:
                update_data = obj_in.dict(exclude_unset=True)
            session.query(self.model).filter(self.model.id == obj_id).update(update_data)  # type: ignore
            session.commit()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        logging.debug(f"Update {update_data} to table {self.model.__tablename__.upper()} done")
        return obj_in

    def delete(
            self,
            session: Session,
            *,
            obj_id: uuid.UUID,
    ) -> None:
        """Define method delete base for repository."""
        try:
            session.query(self.model).filter(self.model.id == obj_id).update({"is_deleted": True})
            session.commit()
            session.expire_all()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        logging.debug(f"Delete {obj_id} to table {self.model.__tablename__.upper()} done")

    def back_up(
            self,
            session: Session,
            *,
            obj_id: uuid.UUID,
    ) -> None:
        """Define method back_up base for repository."""
        try:
            session.query(self.model).filter(self.model.id == obj_id).update({"is_deleted": False})
            session.commit()
            session.expire_all()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        logging.debug(f"Back up {obj_id} to table {self.model.__tablename__.upper()} done")

    def get_back_up(self, session: Session, obj_id: Any) -> Optional[ModelType]:
        """Define method get data by query id."""
        try:
            data = session.query(self.model).filter(self.model.id == obj_id,
                                                    self.model.is_deleted.is_(True)).first()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        logging.debug(f"Get id: {obj_id} from table {self.model.__tablename__.upper()} done")
        return data
    
    def filter(
        self,
        session: Session,
        filters: Dict[str, Any],
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[ModelType]:
        """Define method to filter data based on provided filters."""
        try:
            query = session.query(self.model).filter(self.model.is_deleted.is_(False))

            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)

            if limit is not None:
                query = query.limit(limit)
            if offset is not None:
                query = query.offset(offset)

            data = query.all()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        logging.debug(f"Filtered objects from table {self.model.__tablename__.upper()} done with filters: {filters}")
        return data

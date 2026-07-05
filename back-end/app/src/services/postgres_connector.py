"""Define postgres connector."""
from typing import Optional, Type, TypeVar

from fastapi.encoders import jsonable_encoder
from pydantic.main import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from app.core.db_url import build_database_url
from app.src.models.base_model import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)


class PostgreSQLDB:
    """Define PostgreSQLDB."""

    def __init__(
        self,
        host: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None,
    ):
        """Khởi tạo engine — dùng build_database_url (host:port + encode credential)."""
        _ = (host, username, password, database)  # giữ signature cũ cho BaseService
        db_url = build_database_url()
        self.engine = create_engine(db_url, pool_pre_ping=True)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.Base = declarative_base()
        self.session = Session(self.engine)

    def create_tables(self):
        """Define create table."""
        self.Base.metadata.create_all(bind=self.engine)

    def drop_tables(self):
        """Define drop tables."""
        self.Base.metadata.drop_all(bind=self.engine)

    def get_session(self):
        """Define get_session."""
        return self.SessionLocal()

    def create(self, model: Type[ModelType], obj_in: CreateSchemaType) -> ModelType:
        """Define create."""
        obj_in_data = jsonable_encoder(obj_in, sqlalchemy_safe=True)
        db_obj = model(**obj_in_data)
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def get_by_attribute(self, model, attribute, value):
        """Define get by attribute."""
        session = self.get_session()
        try:
            query = session.query(model).filter(getattr(model, attribute) == value)
            result = query.all()
            return result
        finally:
            session.close()

    def get_single_data(self, model: Type[ModelType], id_value: str) -> Type[ModelType]:
        """Define get_single_data."""
        return self.session.query(model).filter(model.id == id_value).first() 
"""Define product type model."""
import uuid
from sqlalchemy import BOOLEAN, TIMESTAMP, UUID, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.src.utils.common import generate_uuid
from .base_model import Base


class ProductType(Base):
    """Define product type model."""
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=generate_uuid)  # noqa
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    created_at: Mapped[TIMESTAMP] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at: Mapped[TIMESTAMP] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    is_deleted: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False)
    resource = relationship("Resource", backref="product_type")
"""Define resource resource tag."""
from sqlalchemy import BOOLEAN, UUID, Column, ForeignKey, Table

from app.src.models.base_model import Base

resource_resource_tag = Table(
    'resource_has_resource_tags',
    Base.metadata,
    Column('resource_id', UUID, ForeignKey('resources.id'), primary_key=True),
    Column('resource_tag_id', UUID, ForeignKey('resource_tags.id'), primary_key=True),
    Column('is_deleted', BOOLEAN, default=False, nullable=False),
)

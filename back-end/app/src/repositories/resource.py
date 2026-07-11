"""Define resource repository."""
import uuid
from typing import List, Optional

from sqlalchemy import exists
from sqlalchemy.orm import Session

from app.src import models
from app.src.models.resource_has_resource_tag import resource_resource_tag
from app.src.repositories.base_sql import BaseSQLRepository
from app.src.schemas.resource import ResourceGet


def _as_uuid(value: Optional[str]) -> Optional[uuid.UUID]:
    if value is None or value == "":
        return None
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        return None


class FileRepository(BaseSQLRepository[models.Resource]):
    """Define Resource repository."""

    def search_resources(self, session: Session, filters: ResourceGet,
                         user_id: Optional[uuid.UUID] = None) -> List[models.Resource]:
        """Define method to search resources based on filters."""
        query = session.query(self.model).filter(
            self.model.is_deleted.is_(False),
        )
        if user_id:
            query = query.filter(self.model.user_id == user_id)
        rid = _as_uuid(filters.id)
        if rid:
            query = query.filter(self.model.id == rid)
        stage_id = _as_uuid(filters.stage_id)
        if stage_id:
            query = query.filter(self.model.stage_id == stage_id)
        status_id = _as_uuid(filters.status_id)
        if status_id:
            query = query.filter(self.model.status_id == status_id)
        if filters.name:
            query = query.filter(self.model.name.ilike(f"%{filters.name.strip()}%"))
        if filters.version:
            query = query.filter(self.model.version.ilike(f"%{filters.version.strip()}%"))
        platform_id = _as_uuid(filters.platform_id)
        if platform_id:
            query = query.filter(self.model.platform_id == platform_id)
        product_type_id = _as_uuid(filters.product_type_id)
        if product_type_id:
            query = query.filter(self.model.product_type_id == product_type_id)
        repo_id = _as_uuid(filters.repo_id)
        if repo_id:
            query = query.filter(self.model.repo_id == repo_id)
        tag_id = _as_uuid(filters.tag_id)
        if tag_id:
            tag_exists = exists().where(
                resource_resource_tag.c.resource_id == self.model.id,
                resource_resource_tag.c.resource_tag_id == tag_id,
                resource_resource_tag.c.is_deleted.is_(False),
            )
            query = query.filter(tag_exists)
        resources = query.all()
        return resources

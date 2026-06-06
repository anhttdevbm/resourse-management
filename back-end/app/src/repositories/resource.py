"""Define resource repository."""
import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from app.src import models
from app.src.repositories.base_sql import BaseSQLRepository
from app.src.schemas.resource import ResourceGet


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
        if filters.id:
            query = query.filter(self.model.id == filters.id)
        if filters.stage_id:
            query = query.filter(self.model.stage_id == filters.stage_id)
        if filters.status_id:
            query = query.filter(self.model.status_id == filters.status_id)
        if filters.name:
            query = query.filter(self.model.name.like(f"%{filters.name}%"))
        if filters.version:
            query = query.filter(self.model.version == filters.version)
        if filters.platform_id:
            query = query.filter(self.model.platform_id == filters.platform_id)
        if filters.product_type_id:
            query = query.filter(self.model.product_type_id == filters.product_type_id)
        if filters.repo_id:
            query = query.filter(self.model.repo_id == filters.repo_id)
        if filters.tag_id:
            query = query.filter(self.model.tag_id == filters.tag_id)
        resources = query.all()
        return resources

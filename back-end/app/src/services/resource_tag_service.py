"""Define Resource Tag service file."""
import uuid
from typing import Any, Dict

import decouple
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import BEErrorCode
from app.src.repositories.resource_tag import ResourceTagRepository
from app.src.schemas.resource_tag import ResourceTagCreate, ResourceTagUpdate  # noqa

ACCESS_TOKEN_EXPIRE_MINUTES = decouple.config("ACCESS_TOKEN_EXPIRE_MINUTES")
REFRESH_TOKEN_EXPIRE_MINUTES = decouple.config("REFRESH_TOKEN_EXPIRE_MINUTES")

reusable_oauth2 = HTTPBearer(scheme_name='Authorization')


class ResourceTagService(object):
    """Define Resource Tag service object."""

    def __init__(self) -> None:
        """Define constructor for Resource Tag service object."""
        self.resource_tag_repository = ResourceTagRepository(models.ResourceTag)

    def get(self, db_session: Session, resource_tag_id: uuid.UUID, user_id: uuid.UUID) -> models.ResourceTag:
        """Lấy thẻ theo id; chỉ trả về nếu thuộc user."""
        resource_tag = self.resource_tag_repository.get(db_session, resource_tag_id)
        if not resource_tag or str(resource_tag.user_id) != str(user_id):
            raise BEErrorCode.RESOURCE_TAG_NOT_FOUND.value
        return resource_tag

    def delete(self, db_session: Session, resource_tag_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """Xóa thẻ; chỉ được xóa nếu thuộc user."""
        resource_tag = self.resource_tag_repository.get(db_session, resource_tag_id)
        if not resource_tag or str(resource_tag.user_id) != str(user_id):
            raise BEErrorCode.RESOURCE_TAG_NOT_FOUND.value
        self.resource_tag_repository.delete(db_session, obj_id=resource_tag.id)

    def get_all(self, db_session: Session, user_id: uuid.UUID) -> Dict[str, Any]:
        """Lấy tất cả thẻ của user hiện tại."""
        resource_tags = self.resource_tag_repository.get_all_by_user(db_session, user_id)
        data = {}
        if not resource_tags:
            return data
        for resource_tag in resource_tags:
            resource_tag_dict = resource_tag.__dict__.copy()
            resource_tag_dict.pop('_sa_instance_state', None)
            resource_tag_dict['id'] = str(resource_tag_dict['id'])
            resource_tag_dict['name'] = str(resource_tag_dict['name'])
            resource_tag_dict['created_at'] = resource_tag_dict['created_at'].isoformat()
            resource_tag_dict['updated_at'] = resource_tag_dict['updated_at'].isoformat()
            data[resource_tag_dict['id']] = resource_tag_dict
        return data

    def update(
        self, db_session: Session, resource_tag_id: int,
        resource_tag_update: ResourceTagUpdate, user_id: uuid.UUID
    ) -> models.ResourceTag:
        """Cập nhật thẻ; chỉ được sửa nếu thuộc user."""
        resource_tag = self.resource_tag_repository.get(db_session, resource_tag_id)
        if not resource_tag or str(resource_tag.user_id) != str(user_id):
            raise BEErrorCode.RESOURCE_TAG_NOT_FOUND.value
        _ = self.resource_tag_repository.update(db_session, obj_id=resource_tag_id, obj_in=resource_tag_update)
        resource_tag = self.resource_tag_repository.get(db_session, resource_tag_id)
        if not resource_tag:
            raise BEErrorCode.RESOURCE_TAG_NOT_FOUND.value
        return resource_tag

    def create(
        self, db_session: Session, resource_tag_create: ResourceTagCreate, user_id: uuid.UUID
    ) -> models.ResourceTag:
        """Tạo thẻ mới cho user. Tên trùng chỉ kiểm tra trong phạm vi user."""
        resource_tag = self.resource_tag_repository.get_resource_tag_by_name(
            db_session, resource_tag_create.name, user_id
        )
        if resource_tag:
            raise BEErrorCode.RESOURCE_TAG_EXITED.value
        obj_in = {"name": resource_tag_create.name, "user_id": user_id}
        return self.resource_tag_repository.create(db_session, obj_in=obj_in)
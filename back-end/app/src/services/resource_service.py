"""Define Resource service."""
import logging
import os
import tempfile
import uuid
from typing import Dict, List, Optional, Tuple, Union

from fastapi import UploadFile
from fastapi.security import HTTPBearer
from sqlalchemy import delete, insert
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import BEErrorCode, ServerErrorCode
from app.src.models import User
from app.src.models.resource_has_resource_tag import resource_resource_tag
from app.src.repositories.resource import FileRepository
from app.src.repositories.user import UserRepository
from app.src.schemas.resource import ResourceCreate, ResourceInfoCreate, ResourceUpdate
from app.src.schemas.resource import ResourceGet
from app.src.schemas.resource_share import ResourceShareCreate, ResourceShareInfo
from app.src.services.auto_classification_engine import apply_auto_classification
from app.src.services.base_service import BaseService
from app.src.services.user_service import UserService
from app.src.utils.common import pydantic_to_dict

reusable_oauth2 = HTTPBearer(scheme_name="Authorization")
user_service = UserService()


def _user_has_admin_access(db_session: Session, user: User) -> bool:
    return user_service._has_admin_access(db_session, user)


MANAGE_RESOURCES_PERMISSION = "manage_resources"
_PUBLIC_RESOURCE_STATUS_NAMES = frozenset({"Approved", "Active"})

_FK_UUID_FIELDS = frozenset(
    {"stage_id", "status_id", "platform_id", "product_type_id", "repo_id"}
)
_SKIP_UPDATE_FIELDS = frozenset({"tag_id", "user_id", "key"})


def _as_uuid(value: Optional[str]) -> Optional[uuid.UUID]:
    if value is None or value == "":
        return None
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        return None


def _parse_resource_update(
    resource_update: ResourceUpdate,
) -> Tuple[Dict[str, object], Optional[uuid.UUID], bool]:
    """Tách cập nhật cột vs thẻ (M2M). Trả về (columns, tag_id, tag_was_sent)."""
    raw = pydantic_to_dict(resource_update, exclude_unset=True)
    tag_was_sent = "tag_id" in raw
    tag_id = _as_uuid(raw.get("tag_id")) if tag_was_sent else None

    update_data: Dict[str, object] = {}
    for key, value in raw.items():
        if key in _SKIP_UPDATE_FIELDS:
            continue
        if value is None or value == "" or value == "string":
            continue
        if key in _FK_UUID_FIELDS:
            parsed = _as_uuid(str(value))
            if parsed is not None:
                update_data[key] = parsed
        else:
            update_data[key] = value
    return update_data, tag_id, tag_was_sent


def _user_has_manage_resources(db_session: Session, user: User) -> bool:
    """Admin hoặc permission manage_resources (khớp UI Auto Classification)."""
    if _user_has_admin_access(db_session, user):
        return True
    u = user_service._user_with_permissions(db_session, user.id)
    if not u or not getattr(u, "permissions", None):
        return False
    return any(p.name == MANAGE_RESOURCES_PERMISSION for p in u.permissions)


def _user_can_update_resource(db_session: Session, resource: models.Resource, user: User) -> bool:
    if str(resource.user_id) == str(user.id):
        return True
    return _user_has_manage_resources(db_session, user)


def _is_resource_owner(resource: models.Resource, user: User) -> bool:
    return str(resource.user_id) == str(user.id)


def _user_bypasses_approval_gate(db_session: Session, resource: models.Resource, user: User) -> bool:
    return _is_resource_owner(resource, user) or _user_has_admin_access(db_session, user)


def _get_resource_status_name(db_session: Session, resource: models.Resource) -> Optional[str]:
    status = getattr(resource, "resource_status", None)
    if status is not None and getattr(status, "name", None):
        return status.name
    if not resource.status_id:
        return None
    row = (
        db_session.query(models.ResourceStatus)
        .filter(
            models.ResourceStatus.id == resource.status_id,
            models.ResourceStatus.is_deleted.is_(False),
        )
        .first()
    )
    return row.name if row else None


def _is_public_resource_status(status_name: Optional[str]) -> bool:
    return status_name in _PUBLIC_RESOURCE_STATUS_NAMES


def _approved_status_ids(db_session: Session) -> List[uuid.UUID]:
    rows = (
        db_session.query(models.ResourceStatus.id)
        .filter(
            models.ResourceStatus.name.in_(tuple(_PUBLIC_RESOURCE_STATUS_NAMES)),
            models.ResourceStatus.is_deleted.is_(False),
        )
        .all()
    )
    return [row[0] for row in rows]


def _ensure_resource_visible(db_session: Session, resource: models.Resource, user: User) -> None:
    """Owner/admin luôn xem được; user khác chỉ xem tài nguyên đã duyệt."""
    if _user_bypasses_approval_gate(db_session, resource, user):
        return
    if _is_public_resource_status(_get_resource_status_name(db_session, resource)):
        return
    raise BEErrorCode.RESOURCE_NOT_APPROVED.value


def _ensure_can_download(db_session: Session, resource: models.Resource, user: User) -> None:
    """Chỉ owner/admin tải được Pending/Rejected; user được share chỉ tải Approved/Active."""
    if _user_bypasses_approval_gate(db_session, resource, user):
        return
    share = (
        db_session.query(models.ResourceShare)
        .filter(
            models.ResourceShare.resource_id == resource.id,
            models.ResourceShare.shared_with_user_id == user.id,
        )
        .first()
    )
    if not share:
        raise BEErrorCode.USER_NOT_PERMISSION.value
    if not _is_public_resource_status(_get_resource_status_name(db_session, resource)):
        raise BEErrorCode.RESOURCE_DOWNLOAD_NOT_APPROVED.value


def _ensure_can_share(db_session: Session, resource: models.Resource) -> None:
    if not _is_public_resource_status(_get_resource_status_name(db_session, resource)):
        raise BEErrorCode.RESOURCE_SHARE_REQUIRES_APPROVAL.value


class ResourceService:
    """Define resource service."""

    def __init__(self):
        """Define init service."""
        self.base_service = BaseService()
        self.resource_info_mapping = {"ResourceStage": "stage_id", "ResourceStatus": "status_id",
                                      "ResourcePlatform": "platform_id", "ProductType": "product_type_id",
                                      "PackageRepository": "repo_id", "ResourceTag": "tag_id"}
        self.file_repository = FileRepository(models.Resource)
        self.user_repository = UserRepository(models.User)

    def _sync_resource_tags(
        self,
        db_session: Session,
        resource_id: uuid.UUID,
        tag_id: Optional[uuid.UUID],
    ) -> None:
        """Cập nhật thẻ qua bảng nối (resources không có cột tag_id)."""
        db_session.execute(
            delete(resource_resource_tag).where(
                resource_resource_tag.c.resource_id == resource_id
            )
        )
        if tag_id is None:
            return
        tag = (
            db_session.query(models.ResourceTag)
            .filter(
                models.ResourceTag.id == tag_id,
                models.ResourceTag.is_deleted.is_(False),
            )
            .first()
        )
        if not tag:
            raise BEErrorCode.RESOURCE_TAG_NOT_FOUND.value
        db_session.execute(
            insert(resource_resource_tag).values(
                resource_id=resource_id,
                resource_tag_id=tag_id,
                is_deleted=False,
            )
        )

    def _fetch_resource(
        self, db_session: Session, resource_id: uuid.UUID
    ) -> Optional[models.Resource]:
        return (
            db_session.query(models.Resource)
            .filter(models.Resource.id == resource_id, models.Resource.is_deleted.is_(False))
            .first()
        )

    def _commit_resource_changes(self, db_session: Session) -> None:
        try:
            db_session.commit()
        except IntegrityError as ex:
            db_session.rollback()
            detail = str(getattr(ex, "orig", ex)).lower()
            if "resources_name" in detail or ("unique" in detail and "name" in detail):
                raise BEErrorCode.RESOURCE_NAME_EXISTED.value(ex)
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        except SQLAlchemyError as ex:
            db_session.rollback()
            raise ServerErrorCode.DATABASE_ERROR.value(ex)

    def _persist_resource_update(
        self,
        db_session: Session,
        resource_id: Union[str, uuid.UUID],
        resource_update: ResourceUpdate,
    ) -> models.Resource:
        rid = uuid.UUID(str(resource_id))
        resource = self._fetch_resource(db_session, rid)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value

        update_data, tag_id, tag_was_sent = _parse_resource_update(resource_update)
        for key, value in update_data.items():
            setattr(resource, key, value)
        if tag_was_sent:
            self._sync_resource_tags(db_session, rid, tag_id)

        self._commit_resource_changes(db_session)
        resource = self._fetch_resource(db_session, rid)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        return resource

    async def upload_resource(self, file_upload: UploadFile, resource_create: ResourceCreate, user):
        """Define upload resource service (Removed Role Check)."""
        try:
            content = await file_upload.read()
            
            # Get file extension to determine folder
            file_extension = file_upload.filename.split('.')[-1].lower() if '.' in file_upload.filename else 'unknown'

            
            # Map extensions to folders
            folder_mapping = {
                'jpg': 'images', 'jpeg': 'images', 'png': 'images', 'gif': 'images', 'bmp': 'images', 'webp': 'images',
                'pdf': 'documents', 'doc': 'documents', 'docx': 'documents', 'txt': 'documents', 'rtf': 'documents',
                'mp4': 'videos', 'avi': 'videos', 'mov': 'videos', 'wmv': 'videos', 'flv': 'videos',
                'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio',
                'zip': 'archives', 'rar': 'archives', '7z': 'archives', 'tar': 'archives',
                'exe': 'software', 'msi': 'software', 'dmg': 'software', 'deb': 'software',
                'py': 'code', 'js': 'code', 'html': 'code', 'css': 'code', 'java': 'code', 'cpp': 'code', 'c': 'code'
            }
            
            folder = folder_mapping.get(file_extension, 'others')
            # Lưu file vào thư mục uploads nội bộ,
            # đồng thời dùng S3 nếu được cấu hình (best-effort).
            relative_path = os.path.join('uploads', folder, f"{resource_create.version}_{file_upload.filename}")
            url = f"/{relative_path.replace(os.sep, '/')}"
            user_id = user.id

            resource_create_dict = resource_create.dict(exclude={'user_id', 'key'})
            tag_id_from_upload = resource_create.tag_id
            if "tag_id" in resource_create_dict:
                del resource_create_dict["tag_id"]
            resource_create_dict['user_id'] = user_id
            resource_create_dict['url'] = url
            resource_create_dict['is_deleted'] = False
            
            # Check if name already exists in database
            from sqlalchemy.orm import Session
            from app.src.models import Resource
            
            # Get database session
            db_session = self.base_service.engine_postgresql.get_session()

            original_name = resource_create_dict["name"]

            # Tên đang dùng bởi tài nguyên active → thêm timestamp
            existing_active = db_session.query(Resource).filter(
                Resource.name == original_name,
                Resource.is_deleted.is_(False),
            ).first()
            if existing_active:
                import time
                resource_create_dict["name"] = f"{original_name}_{int(time.time())}"
            else:
                print(f"Name is unique: {resource_create_dict['name']}")

            # Tài nguyên đã soft-delete cùng tên → khôi phục thay vì INSERT mới
            soft_deleted = db_session.query(Resource).filter(
                Resource.name == resource_create_dict["name"],
                Resource.is_deleted.is_(True),
            ).first()

            print(f"Resource data: {resource_create_dict}")

            if not resource_create_dict.get("status_id"):
                pending = db_session.query(models.ResourceStatus).filter(
                    models.ResourceStatus.name == "Pending",
                    models.ResourceStatus.is_deleted.is_(False),
                ).first()
                if pending:
                    resource_create_dict["status_id"] = pending.id

            pending_tag_id = apply_auto_classification(
                db_session,
                user.id,
                resource_create_dict,
                filename=file_upload.filename or "",
                only_fill_empty=True,
            )
            if not pending_tag_id and tag_id_from_upload:
                pending_tag_id = tag_id_from_upload

            # Lưu file vào local storage
            try:
                local_full_path = os.path.join(os.getcwd(), relative_path)
                os.makedirs(os.path.dirname(local_full_path), exist_ok=True)
                with open(local_full_path, "wb") as f:
                    f.write(content)
    
            except Exception as fs_error:
                print(f"Local file save failed: {str(fs_error)}")

            # Upload file lên S3 (nếu cấu hình đúng) - best effort
            print(f"Uploading to S3 (best effort)...")
            try:
                self.base_service.engine_s3.put_object(url.lstrip('/'), content)
                print(f"S3 upload successful")
            except Exception as s3_error:
                print(f"S3 upload failed: {str(s3_error)}")

            if soft_deleted:
                for key, value in resource_create_dict.items():
                    setattr(soft_deleted, key, value)
                soft_deleted.is_deleted = False
                soft_deleted.download_count = 0
                db_session.commit()
                db_session.refresh(soft_deleted)
                uploaded_file_metadata = soft_deleted
            else:
                uploaded_file_metadata = self.base_service.engine_postgresql.create(
                    models.Resource, resource_create_dict
                )

            if pending_tag_id:
                try:
                    self._sync_resource_tags(
                        db_session,
                        uploaded_file_metadata.id,
                        uuid.UUID(str(pending_tag_id)),
                    )
                except Exception as tag_error:
                    logging.warning("Auto-classification tag sync failed: %s", tag_error)

            return uploaded_file_metadata

        except Exception as e:
            logging.error(f"Lỗi khi tải lên tài nguyên: {str(e)}")
            raise


    def download_resource(self, db_session: Session, resource_id: str, user):
        """Download resource for current user.

        Ưu tiên đọc file từ local `uploads/...`. Nếu không có thì thử S3.
        """
        resource = self.file_repository.get(db_session, resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value

        _ensure_can_download(db_session, resource, user)

        # Lấy đường dẫn đã lưu trong DB
        stored = self.base_service.engine_postgresql.get_single_data(models.Resource, resource_id)
        file_url = stored.url  # ví dụ: "/uploads/images/1.0.0_file.png" hoặc "/images/..."

        content: Optional[bytes] = None

        # Thử đọc từ local nếu url trỏ vào thư mục uploads
        if file_url.startswith("/uploads/"):
            local_path = os.path.join(os.getcwd(), file_url.lstrip("/"))
            try:
                with open(local_path, "rb") as f:
                    content = f.read()
                print(f"Read file from local uploads: {local_path}")
            except Exception as fs_error:
                print(f"Local read failed, fallback to S3: {str(fs_error)}")

        # Nếu chưa có content, thử đọc từ S3
        if content is None:
            s3_key = file_url.lstrip("/")
            try:
                content = self.base_service.engine_s3.get_object(s3_key)
                print(f"Read file from S3: {s3_key}")
            except Exception as s3_error:
                print(f"S3 get_object failed: {str(s3_error)}")
                content = None

        if not content:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value

        self._record_download(db_session, resource, user)

        # Ghi ra file tạm để FileResponse trả về
        file_path = os.path.join(tempfile.gettempdir(), os.path.basename(file_url))
        with open(file_path, "wb") as file:
            file.write(content)
        return file_path

    def _record_download(self, db_session: Session, resource: models.Resource, user: User) -> None:
        """Persist download log and increment resource download counter."""
        db_session.add(
            models.DownloadLog(resource_id=resource.id, user_id=user.id)
        )
        resource.download_count = (resource.download_count or 0) + 1
        db_session.commit()

    def check_info(self, schema: Union[ResourceCreate, ResourceUpdate]) -> None:
        """Define check infor service."""
        for k, v in self.resource_info_mapping.items():
            info_obj = getattr(schema, v)
            if info_obj:
                if isinstance(info_obj, list):
                    info_obj = info_obj[0] if info_obj else "Default Name"
                elif not isinstance(info_obj, str):
                    info_obj = str(info_obj)

                if k == "Resource":
                    _ = self.base_service.engine_postgresql.create(
                        models.Resource,
                        ResourceInfoCreate(name=info_obj)
                    )


    def get(self, db_session: Session, resource_id: uuid.UUID) -> models.Resource:
        """Define read Resource method."""
        resource = self.file_repository.get(db_session, resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        return resource

    def get_with_permission(self, db_session: Session, resource_id: uuid.UUID, user: User) -> models.Resource:
        """Get resource by id, only if current user is owner or is shared to them."""
        resource = self.file_repository.get(db_session, resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        if not _is_resource_owner(resource, user):
            share = db_session.query(models.ResourceShare).filter(
                models.ResourceShare.resource_id == resource.id,
                models.ResourceShare.shared_with_user_id == user.id,
            ).first()
            if not share:
                raise BEErrorCode.USER_NOT_PERMISSION.value
        _ensure_resource_visible(db_session, resource, user)
        return resource

    def search_resources(self, db_session: Session, filters: ResourceGet,
                         user: User) -> List[models.Resource]:
        """Search resources cho trang 'Tài nguyên của tôi'.

        Bao gồm:
        - Tài nguyên do user hiện tại sở hữu
        - Tài nguyên được người khác share cho user hiện tại
        """
        from sqlalchemy import and_

        # Query tài nguyên do user sở hữu
        own_q = db_session.query(models.Resource).filter(
            models.Resource.is_deleted.is_(False),
            models.Resource.user_id == user.id,
        )

        # Apply filters giống FileRepository.search_resources
        if filters.id:
            own_q = own_q.filter(models.Resource.id == filters.id)
        if filters.stage_id:
            own_q = own_q.filter(models.Resource.stage_id == filters.stage_id)
        if filters.status_id:
            own_q = own_q.filter(models.Resource.status_id == filters.status_id)
        if filters.name:
            own_q = own_q.filter(models.Resource.name.like(f"%{filters.name}%"))
        if filters.version:
            own_q = own_q.filter(models.Resource.version == filters.version)
        if filters.platform_id:
            own_q = own_q.filter(models.Resource.platform_id == filters.platform_id)
        if filters.product_type_id:
            own_q = own_q.filter(models.Resource.product_type_id == filters.product_type_id)
        if filters.repo_id:
            own_q = own_q.filter(models.Resource.repo_id == filters.repo_id)

        # Query tài nguyên được share cho user
        shared_q = (
            db_session.query(models.Resource)
            .join(models.ResourceShare, models.Resource.id == models.ResourceShare.resource_id)
            .filter(
                models.Resource.is_deleted.is_(False),
                models.ResourceShare.shared_with_user_id == user.id,
            )
        )

        if filters.id:
            shared_q = shared_q.filter(models.Resource.id == filters.id)
        if filters.stage_id:
            shared_q = shared_q.filter(models.Resource.stage_id == filters.stage_id)
        if filters.status_id:
            shared_q = shared_q.filter(models.Resource.status_id == filters.status_id)
        if filters.name:
            shared_q = shared_q.filter(models.Resource.name.like(f"%{filters.name}%"))
        if filters.version:
            shared_q = shared_q.filter(models.Resource.version == filters.version)
        if filters.platform_id:
            shared_q = shared_q.filter(models.Resource.platform_id == filters.platform_id)
        if filters.product_type_id:
            shared_q = shared_q.filter(models.Resource.product_type_id == filters.product_type_id)
        if filters.repo_id:
            shared_q = shared_q.filter(models.Resource.repo_id == filters.repo_id)

        approved_ids = _approved_status_ids(db_session)
        if approved_ids:
            shared_q = shared_q.filter(models.Resource.status_id.in_(approved_ids))
        else:
            shared_q = shared_q.filter(models.Resource.id.is_(None))

        resources = own_q.union(shared_q).all()
        sorted_resource = sorted(resources, key=lambda x: x.created_at)
        return sorted_resource

    def search_all_resources(
        self,
        db_session: Session,
        filters: ResourceGet,
        actor: User,
        *,
        include_deleted: bool = False,
    ) -> List[models.Resource]:
        """List all resources in the system (admin only)."""
        if not _user_has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value

        query = db_session.query(models.Resource)
        if not include_deleted:
            query = query.filter(models.Resource.is_deleted.is_(False))
        if filters.id:
            query = query.filter(models.Resource.id == filters.id)
        if filters.stage_id:
            query = query.filter(models.Resource.stage_id == filters.stage_id)
        if filters.status_id:
            query = query.filter(models.Resource.status_id == filters.status_id)
        if filters.name:
            query = query.filter(models.Resource.name.like(f"%{filters.name}%"))
        if filters.version:
            query = query.filter(models.Resource.version == filters.version)
        if filters.platform_id:
            query = query.filter(models.Resource.platform_id == filters.platform_id)
        if filters.product_type_id:
            query = query.filter(models.Resource.product_type_id == filters.product_type_id)
        if filters.repo_id:
            query = query.filter(models.Resource.repo_id == filters.repo_id)

        resources = query.all()
        return sorted(resources, key=lambda x: x.created_at, reverse=True)

    def admin_update(
        self,
        db_session: Session,
        resource_id: str,
        resource_update: ResourceUpdate,
        actor: User,
    ) -> models.Resource:
        """Update any resource (admin only)."""
        if not _user_has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        resource = self.file_repository.get(db_session, resource_id)
        if not resource:
            deleted = self.file_repository.get_back_up(db_session, obj_id=resource_id)
            if not deleted:
                raise BEErrorCode.RESOURCE_NOT_FOUND.value
            resource = deleted
        return self._persist_resource_update(db_session, resource_id, resource_update)

    def admin_delete(self, db_session: Session, resource_id: str, actor: User) -> None:
        """Soft-delete any resource (admin only)."""
        if not _user_has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        resource = self.file_repository.get(db_session, resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        self.file_repository.delete(db_session, obj_id=resource.id)

    def admin_restore(self, db_session: Session, resource_id: str, actor: User) -> models.Resource:
        """Restore a soft-deleted resource (admin only)."""
        if not _user_has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        resource = self.file_repository.get_back_up(db_session, obj_id=resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        self.file_repository.back_up(db_session, obj_id=resource.id)
        return self.file_repository.get(db_session, resource_id)

    # ----- UC-RES-01: Cập nhật tài nguyên (Service) -----
    def update(
        self,
        db_session: Session,
        resource_id: Union[str, uuid.UUID],
        resource_update: ResourceUpdate,
        user: User,
    ) -> models.Resource:
        """Bước 4–6: kiểm tra quyền → _persist_resource_update → PostgreSQL."""
        resource = self.file_repository.get(db_session, resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        if not _user_can_update_resource(db_session, resource, user):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        return self._persist_resource_update(db_session, resource_id, resource_update)

    def delete(self, db_session: Session, resource_id: uuid.UUID) -> None:
        """Define remove resource method."""
        resource = self.file_repository.get(db_session, obj_id=resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        self.file_repository.delete(db_session, obj_id=resource.id)

    # ------- Sharing APIs -------
    def share_resource(self, db_session: Session, resource_id: uuid.UUID,
                       payload: ResourceShareCreate, owner: User) -> ResourceShareInfo:
        """Share a resource with another user by email."""
        resource = self.file_repository.get(db_session, obj_id=resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        # Chỉ chủ tài nguyên mới được share
        if resource.user_id != owner.id:
            raise BEErrorCode.USER_NOT_PERMISSION.value
        _ensure_can_share(db_session, resource)

        target_user = self.user_repository.get_user_by_email(db_session, payload.email)
        if not target_user:
            raise BEErrorCode.SHARE_USER_NOT_FOUND.value

        # Không cho share cho chính mình (không cần thiết)
        if target_user.id == owner.id:
            raise BEErrorCode.SHARE_SELF_NOT_ALLOWED.value

        share = db_session.query(models.ResourceShare).filter(
            models.ResourceShare.resource_id == resource.id,
            models.ResourceShare.shared_with_user_id == target_user.id,
        ).first()

        if share:
            share.can_edit = payload.can_edit
        else:
            share = models.ResourceShare(
                resource_id=resource.id,
                shared_with_user_id=target_user.id,
                can_edit=payload.can_edit,
            )
            db_session.add(share)

        db_session.commit()
        db_session.refresh(share)

        return ResourceShareInfo(
            id=str(share.id),
            user_id=str(target_user.id),
            email=target_user.email,
            name=target_user.name,
            can_edit=share.can_edit,
            created_at=share.created_at.isoformat() if share.created_at else "",
        )

    def list_shares(self, db_session: Session, resource_id: uuid.UUID, owner: User) -> List[ResourceShareInfo]:
        """List all users this resource is shared with (owner only)."""
        resource = self.file_repository.get(db_session, obj_id=resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        if resource.user_id != owner.id:
            raise BEErrorCode.USER_NOT_PERMISSION.value

        rows = (
            db_session.query(models.ResourceShare, models.User)
            .join(models.User, models.ResourceShare.shared_with_user_id == models.User.id)
            .filter(models.ResourceShare.resource_id == resource.id)
            .all()
        )

        result: List[ResourceShareInfo] = []
        for share, user_obj in rows:
            result.append(
                ResourceShareInfo(
                    id=str(share.id),
                    user_id=str(user_obj.id),
                    email=user_obj.email,
                    name=user_obj.name,
                    can_edit=share.can_edit,
                    created_at=share.created_at.isoformat() if share.created_at else "",
                )
            )
        return result

    def remove_share(self, db_session: Session, resource_id: uuid.UUID, target_user_id: uuid.UUID, owner: User) -> None:
        """Remove sharing for a specific user (owner only)."""
        resource = self.file_repository.get(db_session, obj_id=resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        if resource.user_id != owner.id:
            raise BEErrorCode.USER_NOT_PERMISSION.value

        share = db_session.query(models.ResourceShare).filter(
            models.ResourceShare.resource_id == resource.id,
            models.ResourceShare.shared_with_user_id == target_user_id,
        ).first()
        if share:
            db_session.delete(share)
            db_session.commit()

    def back_up(self, db_session: Session, resource_id: uuid.UUID) -> None:
        """Define back up resource method."""
        resource = self.file_repository.get_back_up(db_session, obj_id=resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        self.file_repository.back_up(db_session, obj_id=resource.id)
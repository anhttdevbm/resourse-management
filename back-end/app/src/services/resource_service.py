"""Define Resource service."""
import logging
import os
import tempfile
import uuid
from typing import List, Union

from fastapi import UploadFile
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import BEErrorCode
from app.src.models import User
from app.src.repositories.resource import FileRepository
from app.src.repositories.user import UserRepository
from app.src.schemas.resource import ResourceCreate, ResourceInfoCreate, ResourceUpdate
from app.src.schemas.resource import ResourceGet
from app.src.schemas.resource_share import ResourceShareCreate, ResourceShareInfo
from app.src.services.base_service import BaseService
from app.src.services.user_service import UserService

reusable_oauth2 = HTTPBearer(scheme_name="Authorization")
user_service = UserService()


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

    async def upload_resource(self, file_upload: UploadFile, resource_create: ResourceCreate, user):
        """Define upload resource service (Removed Role Check)."""
        try:
            print(f"📁 Reading file content...")
            content = await file_upload.read()
            print(f"📁 File size: {len(content)} bytes")
            
            # Get file extension to determine folder
            file_extension = file_upload.filename.split('.')[-1].lower() if '.' in file_upload.filename else 'unknown'
            print(f"🔍 Original filename: {file_upload.filename}")
            print(f"🔍 Detected extension: {file_extension}")
            
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
            
            # Check if name exists
            existing_resource = db_session.query(Resource).filter(
                Resource.name == resource_create_dict['name'],
                Resource.is_deleted == False
            ).first()
            
            # Only add timestamp if name already exists
            if existing_resource:
                import time
                timestamp = int(time.time())
                resource_create_dict['name'] = f"{resource_create_dict['name']}_{timestamp}"
                print(f"⚠️ Name conflict detected, adding timestamp: {resource_create_dict['name']}")
            else:
                print(f"✅ Name is unique: {resource_create_dict['name']}")  
            print(f"📝 Resource data: {resource_create_dict}")

            # Lưu file vào local storage
            try:
                local_full_path = os.path.join(os.getcwd(), relative_path)
                os.makedirs(os.path.dirname(local_full_path), exist_ok=True)
                with open(local_full_path, "wb") as f:
                    f.write(content)
                print(f"💾 Saved file locally at: {local_full_path}")
            except Exception as fs_error:
                print(f"⚠️ Local file save failed: {str(fs_error)}")

            # Upload file lên S3 (nếu cấu hình đúng) - best effort
            print(f"☁️ Uploading to S3 (best effort)...")
            try:
                self.base_service.engine_s3.put_object(url.lstrip('/'), content)
                print(f"✅ S3 upload successful")
            except Exception as s3_error:
                print(f"⚠️ S3 upload failed: {str(s3_error)}")

            uploaded_file_metadata = self.base_service.engine_postgresql.create(models.Resource, resource_create_dict)

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

        # Chỉ cho phép nếu là chủ tài nguyên hoặc được share
        if resource.user_id != user.id:
            share = db_session.query(models.ResourceShare).filter(
                models.ResourceShare.resource_id == resource.id,
                models.ResourceShare.shared_with_user_id == user.id,
            ).first()
            if not share:
                raise BEErrorCode.USER_NOT_PERMISSION.value

        # Lấy đường dẫn đã lưu trong DB
        stored = self.base_service.engine_postgresql.get_single_data(models.Resource, resource_id)
        file_url = stored.url  # ví dụ: "/uploads/images/1.0.0_file.png" hoặc "/images/..."

        content: bytes | None = None

        # Thử đọc từ local nếu url trỏ vào thư mục uploads
        if file_url.startswith("/uploads/"):
            local_path = os.path.join(os.getcwd(), file_url.lstrip("/"))
            try:
                with open(local_path, "rb") as f:
                    content = f.read()
                print(f"💾 Read file from local uploads: {local_path}")
            except Exception as fs_error:
                print(f"⚠️ Local read failed, fallback to S3: {str(fs_error)}")

        # Nếu chưa có content, thử đọc từ S3
        if content is None:
            s3_key = file_url.lstrip("/")
            try:
                content = self.base_service.engine_s3.get_object(s3_key)
                print(f"☁️ Read file from S3: {s3_key}")
            except Exception as s3_error:
                print(f"❌ S3 get_object failed: {str(s3_error)}")
                content = None

        if not content:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value

        # Ghi ra file tạm để FileResponse trả về
        file_path = os.path.join(tempfile.gettempdir(), os.path.basename(file_url))
        with open(file_path, "wb") as file:
            file.write(content)
        return file_path

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
        if resource.user_id != user.id:
            share = db_session.query(models.ResourceShare).filter(
                models.ResourceShare.resource_id == resource.id,
                models.ResourceShare.shared_with_user_id == user.id,
            ).first()
            if not share:
                raise BEErrorCode.USER_NOT_PERMISSION.value
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

        resources = own_q.union(shared_q).all()
        sorted_resource = sorted(resources, key=lambda x: x.created_at)
        return sorted_resource

    def update(self, db_session: Session, resource_id: int, resource_update: ResourceUpdate, user) -> models.Resource:
        """Update an existing resource."""
        resource = self.file_repository.get(db_session, resource_id)
        user_id = str(user.id)
        if resource.user_id == user_id:
            if self.file_repository.get(db_session, resource_id) is None:
                raise BEErrorCode.RESOURCE_NOT_FOUND.value
            update_data = {}
            for key, value in resource_update.dict().items():
                if value != 'string':
                    update_data[key] = value
            if update_data:
                _ = self.file_repository.update(db_session, obj_id=resource_id, obj_in=update_data)
        resource = self.file_repository.get(db_session, resource_id)
        if not resource:
            raise BEErrorCode.RESOURCE_NOT_FOUND.value
        return resource

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

        target_user = self.user_repository.get_user_by_email(db_session, payload.email)
        if not target_user:
            raise BEErrorCode.USER_NOT_FOUND.value

        # Không cho share cho chính mình (không cần thiết)
        if target_user.id == owner.id:
            raise BEErrorCode.CONFIG_EXISTED.value  # dùng tạm cho trường hợp không hợp lệ

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
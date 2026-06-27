"""Define user controller."""
from typing import Tuple
import uuid
from fastapi import APIRouter, Depends, Query, File, UploadFile, HTTPException, Path
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from uuid import UUID
from app.src.models import User
from app.src.schemas.response import ResponseObject
from app.src.schemas.user import (
    UserCreate,
    UserUpdate,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    UserPermissionPatch,
)
from app.src.schemas.user_settings import UserSettingsUpdate
from app.src.schemas.permission import PermissionCreate, PermissionUpdate
from app.src.services.user_service import UserService
from app.src.services.base_service import BaseService
from app.src.utils.common import row2dict
from app.src.utils.connection.sql_connection import get_db_session
from sqlalchemy.ext.asyncio import AsyncSession
from decouple import config
import io

reusable_oauth2 = HTTPBearer(scheme_name="Authorization")

user_service = UserService()
base_service = BaseService()

users_routers = APIRouter()


@users_routers.get("/users")
def read_users(
    db_session: Session = Depends(get_db_session), # noqa
    user: Tuple[User, str] = Depends(user_service.get_current_user), # noqa
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Users per page")
) -> ResponseObject:
    """Get all user with pagination."""
    data = user_service.get_all_user(db_session, user[0], page=page, page_size=page_size)
    return ResponseObject(data=data, code="BE0000")


@users_routers.post("/users")
def create_user(
    user_create: UserCreate,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Define create a user (admin)."""
    data = user_service.create_user(db_session, user_create, user[0])
    return ResponseObject(data=user_service.get_user_by_id(db_session, data.id, user[0]), code="BE0000")

@users_routers.post("/users/filter")
def filter_users(filter_criteria: UserUpdate, db_session: Session = Depends(get_db_session),
                 user: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject:
    """Filter users based on given criteria."""
    data = user_service.filter_users(db_session, filter_criteria, user[0])
    return ResponseObject(data=data, code="BE0000")


@users_routers.get("/permissions/names")
def list_permission_names(
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """List all permission names (admin)."""
    data = user_service.list_permission_names(db_session, user[0])
    return ResponseObject(data={"permissions": data}, code="BE0000")


@users_routers.get("/permissions")
def list_permissions(
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """List all permissions with metadata (admin)."""
    data = user_service.list_permissions_admin(db_session, user[0])
    return ResponseObject(data={"permissions": data, "total": len(data)}, code="BE0000")


@users_routers.post("/permissions")
def create_permission(
    body: PermissionCreate,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    data = user_service.create_permission_admin(db_session, body, user[0])
    return ResponseObject(data=data, code="BE0000")


@users_routers.put("/permissions/{permission_id}")
def update_permission(
    permission_id: UUID = Path(...),
    body: PermissionUpdate = ...,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    data = user_service.update_permission_admin(db_session, permission_id, body, user[0])
    return ResponseObject(data=data, code="BE0000")


@users_routers.delete("/permissions/{permission_id}")
def delete_permission(
    permission_id: UUID = Path(...),
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    user_service.delete_permission_admin(db_session, permission_id, user[0])
    return ResponseObject(message="Delete permission success", code="BE0000")


@users_routers.get("/permissions/{permission_id}/users")
def list_permission_users(
    permission_id: UUID = Path(...),
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    users = user_service.get_permission_users_admin(db_session, permission_id, user[0])
    return ResponseObject(data={"users": users, "total": len(users)}, code="BE0000")


@users_routers.post("/users/{user_id}/permissions")
def grant_user_permission(
    user_id: UUID = Path(...),
    body: UserPermissionPatch = ...,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    data = user_service.grant_permission_to_user(db_session, user_id, body.permission, user[0])
    return ResponseObject(data=data, code="BE0000")


@users_routers.delete("/users/{user_id}/permissions/{permission_name}")
def revoke_user_permission(
    user_id: UUID = Path(...),
    permission_name: str = Path(...),
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    data = user_service.revoke_permission_from_user(db_session, user_id, permission_name, user[0])
    return ResponseObject(data=data, code="BE0000")


@users_routers.get("/users/me")
def read_user_me(db_session: Session = Depends(get_db_session), # noqa
                 user: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Get user me."""
    data = user_service.get_user_by_access_token_me(db_session, user[1])
    return ResponseObject(data=data  , code="BE0000")


@users_routers.patch("/users/me")
def update_user_me(
    user_update: UserUpdate,
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Update current user's own information."""
    user = current_user[0]
    data = user_service.update_current_user(db_session, user, user_update)
    return ResponseObject(data=data, code="BE0000")


@users_routers.get("/users/me/settings")
def read_user_me_settings(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Cài đặt giao diện & hành vi (JSON preferences trên user)."""
    user = current_user[0]
    data = user_service.get_user_settings(db_session, user)
    return ResponseObject(data=data, code="BE0000")


@users_routers.patch("/users/me/settings")
def patch_user_me_settings(
    patch: UserSettingsUpdate,
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Cập nhật một phần cài đặt (merge vào preferences)."""
    user = current_user[0]
    data = user_service.patch_user_settings(db_session, user, patch)
    return ResponseObject(data=data, code="BE0000")


@users_routers.get("/users/{user_id}")
def read_user_by_id(
    user_id: UUID = Path(...),
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Get user by id."""
    data = user_service.get_user_by_id(db_session, user_id, user[0])
    return ResponseObject(data=data, code="BE0000")


@users_routers.put("/users/{user_id}")
def update_user(
    user_id: UUID = Path(...),
    user_update: UserUpdate = ...,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Update an existing user."""
    data = user_service.update_user(db_session, user_id, user_update, user[0])
    return ResponseObject(data=data, code="BE0000")


@users_routers.delete("/users/{user_id}")
def delete_user(
    user_id: UUID = Path(...),
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Delete a user."""
    user_service.delete_user(db_session, user_id, user[0])
    return ResponseObject(message="Delete User Success", code="BE0000")


@users_routers.post("/users/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Upload avatar for current user."""
    user = current_user[0]
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)")
    
    # Validate file size (max 5MB)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Kích thước file không được vượt quá 5MB")
    
    # Query user from database to get latest avatar_url (ensure we have fresh data)
    from app.src import models
    from app.src.repositories.user import UserRepository
    user_repo = UserRepository(models.User)
    fresh_user = user_repo.get(db_session, user.id)
    old_avatar_key = fresh_user.avatar_url if fresh_user and fresh_user.avatar_url else None
    print(f"📸 Current avatar_url in DB: {old_avatar_key}")
    
    # Generate unique filename with timestamp to ensure uniqueness
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    import time
    timestamp = int(time.time() * 1000)  # milliseconds timestamp
    unique_id = uuid.uuid4().hex[:8]  # Short unique ID
    avatar_filename = f"avatars/{user.id}_{timestamp}_{unique_id}.{file_extension}"
    
    try:
        # Delete old avatar if exists (before uploading new one)
        if old_avatar_key:
            # Extract object key if it's a full URL
            object_key_to_delete = old_avatar_key
            if "avatars/" in old_avatar_key and ("http://" in old_avatar_key or "https://" in old_avatar_key):
                # Extract object key from URL
                parts = old_avatar_key.split("avatars/")
                if len(parts) > 1:
                    object_key_to_delete = f"avatars/{parts[1].split('?')[0]}"  # Remove query params
            
            # Only delete if it's an object key (starts with avatars/)
            if object_key_to_delete.startswith("avatars/"):
                try:
                    base_service.engine_s3.delete_object(object_key_to_delete)
                    print(f"🗑️ Deleted old avatar: {object_key_to_delete}")
                except Exception as delete_error:
                    print(f"⚠️ Could not delete old avatar (may not exist): {str(delete_error)}")
        
        # Upload new avatar to MinIO
        base_service.engine_s3.put_object(avatar_filename, content)
        print(f"✅ Uploaded new avatar: {avatar_filename}")
        
        # Store object key in avatar_url, frontend will use proxy endpoint
        # This avoids CORS and internal network issues
        avatar_url = avatar_filename  # Store object key
        print(f"✅ Stored object key: {avatar_url}")
        
        # Update user avatar_url
        user_update = UserUpdate(avatar_url=avatar_url)
        
        # Flush to ensure changes are in session but not yet committed
        db_session.flush()
        
        # Update user
        data = user_service.update_current_user(db_session, user, user_update)
        
        # Commit the transaction
        db_session.commit()
        
        # Refresh user object to get latest data from database
        db_session.refresh(user)
        print(f"✅ After commit, user.avatar_url: {user.avatar_url}")
        
        # Query fresh user data to ensure we have the latest
        fresh_user = user_repo.get(db_session, user.id)
        if fresh_user:
            print(f"✅ Verified updated user avatar_url: {fresh_user.avatar_url}")
            # Ensure response data has the latest avatar_url
            data['avatar_url'] = fresh_user.avatar_url
            print(f"✅ Response data avatar_url: {data.get('avatar_url')}")
        else:
            print(f"⚠️ Could not verify user update")
            # Fallback: use the avatar_url we just set
            data['avatar_url'] = avatar_url
        
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        import traceback
        error_detail = f"Lỗi khi upload avatar: {str(e)}\n{traceback.format_exc()}"
        print(f"❌ Avatar upload error: {error_detail}")
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi khi upload avatar: {str(e)}")


@users_routers.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db_session)):
    await user_service.send_reset_email(data.email, db)
    return {"message": "Reset email sent"}


@users_routers.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db_session)):
    await user_service.reset_user_password(data.token, data.new_password, db)
    return {"message": "Password reset successful"}


@users_routers.post("/users/me/change-password")
def change_password(
    change_password_request: ChangePasswordRequest,
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Change password for current user."""
    user = current_user[0]
    data = user_service.change_password(db_session, user, change_password_request)
    return ResponseObject(data=data, code="BE0000", message="Đổi mật khẩu thành công")


@users_routers.get("/users/me/avatar")
def get_avatar(
    token: str = Query(None, description="Access token for authentication"),
    db_session: Session = Depends(get_db_session),
):
    """Get current user's avatar from MinIO. Requires token in query param for browser access."""
    # Get user from token (required for browser img src access)
    if not token:
        raise HTTPException(status_code=401, detail="Token required in query parameter")
    
    user = user_service.get_user_by_access_token(db_session, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if not user.avatar_url:
        raise HTTPException(status_code=404, detail="Avatar not found")
    
    # avatar_url is stored as object key (e.g., "avatars/userid_uuid.ext")
    # or could be a full URL (for backward compatibility)
    try:
        object_key = user.avatar_url
        
        # If it's a full URL, extract object key
        if "avatars/" in object_key and ("http://" in object_key or "https://" in object_key):
            # Extract object key from URL
            parts = object_key.split("avatars/")
            if len(parts) > 1:
                object_key = f"avatars/{parts[1].split('?')[0]}"  # Remove query params if any
        
        # Get file from MinIO
        file_content = base_service.engine_s3.get_object(object_key)
        
        # Determine content type from file extension
        content_type = "image/jpeg"
        if object_key.endswith(".png"):
            content_type = "image/png"
        elif object_key.endswith(".gif"):
            content_type = "image/gif"
        elif object_key.endswith(".webp"):
            content_type = "image/webp"
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=31536000",
                "Access-Control-Allow-Origin": "*"
            }
        )
    except Exception as e:
        print(f"❌ Error getting avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving avatar: {str(e)}")
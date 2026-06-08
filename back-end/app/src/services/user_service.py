"""Define user service file."""
import uuid
from uuid import uuid4
from typing import Any, Dict, List, Optional, Union
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.settings import settings
from app.src.utils.email_utils import send_email
from datetime import datetime, timedelta
from app.src import models
from app.src.exceptions.error_code import AuthErrorCode, BEErrorCode
from app.src.models import User
from app.src.models.user_has_permission import UserHasPermission
from app.src.repositories.blacklist_token import BlackListTokenRepository
from app.src.repositories.user import UserRepository
from app.src.schemas.session import TokenPayload
from app.src.schemas.user import UserCreate, UserUpdate, ChangePasswordRequest
from app.src.schemas.user_settings import UserSettingsUpdate, default_user_settings
from app.src.schemas.auth_schema import ResetPasswordRequest
from app.src.utils.connection.sql_connection import get_db_session
from app.src.utils.security import get_password_hash, jwt_decode_token, verify_password

reusable_oauth2 = HTTPBearer(scheme_name="Authorization")

ADMIN_PERMISSION_NAMES = frozenset({"AllAccess", "User:AllAccess"})


class UserService(object):
    """Define User service object."""

    def __init__(self) -> None:
        """Define constructor for User service object."""
        self.user_repository = UserRepository(models.User)
        self.blacklist_token_repository = BlackListTokenRepository(
            models.BlacklistToken,
        )

    def _user_with_permissions(self, db_session: Session, user_id: uuid.UUID) -> Optional[models.User]:
        from sqlalchemy.orm import joinedload
        return (
            db_session.query(models.User)
            .options(joinedload(models.User.permissions))
            .filter(models.User.id == user_id, models.User.is_deleted.is_(False))
            .first()
        )

    def _has_admin_access(self, db_session: Session, actor: models.User) -> bool:
        u = self._user_with_permissions(db_session, actor.id)
        if not u:
            return False
        return any(p.name in ADMIN_PERMISSION_NAMES for p in u.permissions)

    def _serialize_user_admin(self, user: models.User) -> Dict[str, Any]:
        perms = [p.name for p in getattr(user, "permissions", []) or []]
        is_admin = any(p in ADMIN_PERMISSION_NAMES for p in perms)
        return {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "avatar_url": user.avatar_url or None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "permissions": perms,
            "is_admin": is_admin,
            "has_password": bool(user.password),
        }

    def get_user_by_access_token(self, db_session: Session, token: str) -> Union[models.User]:
        """Define get user system by access token."""
        if self.blacklist_token_repository.is_black_token(db_session, token):
            raise AuthErrorCode.BLACKLIST_TOKEN.value
        payload = jwt_decode_token(token)
        token_data = TokenPayload(**payload)
        user = self.user_repository.get_user_by_email(db_session, token_data.sub)
        if user:
            return user

    def get_current_user(
            self,
            db_session: Session = Depends(get_db_session),
            credentials: HTTPAuthorizationCredentials = Depends(reusable_oauth2),
    ) -> Union[tuple[User, str]]:
        """Define get current user method."""
        user = self.get_user_by_access_token(db_session, credentials.credentials)
        return user, credentials.credentials

    def authenticate(
            self,
            db_session: Session,
            email: str,
            password: str,
    ) -> models.User:
        """Define authenticate method."""
        user = self.user_repository.get_user_by_email(db_session, email)
        if not user:
            raise AuthErrorCode.USERNAME_NOT_FOUND.value
        if not verify_password(password, str(user.password)):
            raise AuthErrorCode.INCORRECT_PASSWORD.value
        return user

    def get_user_by_id(self, db_session: Session, user_id: uuid.UUID, actor: models.User) -> Dict[str, Any]:
        """Get user by id (admin)."""
        if not self._has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        target = self._user_with_permissions(db_session, user_id)
        if not target:
            raise AuthErrorCode.USERNAME_NOT_FOUND.value
        return self._serialize_user_admin(target)

    def create_user(self, db_session: Session, user_create: UserCreate, actor: Optional[models.User] = None) -> models.User:
        """Define create user method."""
        if actor is not None and not self._has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        if self.user_repository.get_user_by_email(db_session, user_create.email):
            raise AuthErrorCode.USER_EXISTED.value

        create_data = {
            "name": user_create.name.strip(),
            "email": user_create.email.strip().lower(),
            "password": get_password_hash(user_create.password).decode("utf-8"),
        }
        user = self.user_repository.create(db_session, obj_in=create_data)
        self._assign_basic_permissions_sync(db_session, user)
        return user

    def _assign_basic_permissions_sync(self, db_session: Session, user: models.User):
        """Gán permissions cơ bản cho user mới (sync version)."""
        try:
            # Lấy các permissions cơ bản cho user
            basic_permissions = [
                "view_resources",      # Xem tài nguyên
                "upload_resources",    # Upload tài nguyên  
                "view_file_types",     # Xem loại file
                "view_categories",     # Xem danh mục
                "view_uploads",        # Xem uploads
                "view_profile"         # Xem profile
            ]
            
            # Tìm hoặc tạo permissions trong database
            for permission_name in basic_permissions:
                permission = db_session.query(models.Permission).filter_by(name=permission_name, is_deleted=False).first()
                
                # Nếu permission chưa tồn tại, tạo mới
                if not permission:
                    permission = models.Permission(
                        name=permission_name,
                        is_deleted=False
                    )
                    db_session.add(permission)
                    db_session.flush()  # Flush để lấy ID
                    print(f"✅ Đã tạo permission mới: {permission_name}")
                
                # Kiểm tra xem user đã có permission này chưa
                existing = db_session.query(models.UserHasPermission).filter_by(
                    user_system_id=user.id,
                    permission_id=permission.id,
                    is_deleted=False
                ).first()
                
                if not existing:
                    # Gán permission cho user
                    user_permission = models.UserHasPermission(
                        user_system_id=user.id,
                        permission_id=permission.id,
                        is_deleted=False
                    )
                    db_session.add(user_permission)
                    print(f"✅ Đã gán permission '{permission_name}' cho user {user.name}")
            
            db_session.commit()
            print(f"✅ Đã gán tất cả permissions cơ bản cho user {user.name} ({user.email})")
            
        except Exception as e:
            print(f"❌ Lỗi khi gán permissions cho user {user.name}: {str(e)}")
            import traceback
            traceback.print_exc()
            db_session.rollback()

    def delete_user(self, db_session: Session, user_id: uuid.UUID, actor: models.User) -> None:
        """Soft-delete user (admin)."""
        if not self._has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        if str(actor.id) == str(user_id):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        target = self.user_repository.get(db_session, user_id)
        if not target:
            raise AuthErrorCode.USERNAME_NOT_FOUND.value
        self.user_repository.delete(db_session, obj_id=target.id)

    def update_user(
        self, db_session: Session, user_id: uuid.UUID, user_update: UserUpdate, actor: models.User
    ) -> Dict[str, Any]:
        """Update an existing user (admin)."""
        if not self._has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        if self.user_repository.get(db_session, user_id) is None:
            raise BEErrorCode.USER_NOT_FOUND.value
        update_data = user_update.dict(exclude_unset=True)
        update_data = {k: v for k, v in update_data.items() if v is not None}
        if "password" in update_data and update_data["password"]:
            update_data["password"] = get_password_hash(update_data["password"]).decode("utf-8")
        elif "password" in update_data:
            del update_data["password"]
        if "email" in update_data and update_data["email"]:
            existing = self.user_repository.get_user_by_email(db_session, update_data["email"])
            if existing and str(existing.id) != str(user_id):
                raise AuthErrorCode.EMAIL_EXISTED.value
        self.user_repository.update(db_session, obj_id=user_id, obj_in=update_data)
        target = self._user_with_permissions(db_session, user_id)
        if not target:
            raise BEErrorCode.USER_NOT_FOUND.value
        return self._serialize_user_admin(target)

    def get_all_user(self, db_session: Session, actor: models.User, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        """Retrieve all users with pagination (admin)."""
        if not self._has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        from sqlalchemy.orm import joinedload
        offset = (page - 1) * page_size
        total = self.user_repository.count_all(db_session)
        users = (
            db_session.query(models.User)
            .options(joinedload(models.User.permissions))
            .filter(models.User.is_deleted.is_(False))
            .order_by(models.User.created_at.desc())
            .limit(page_size)
            .offset(offset)
            .all()
        )
        data = [self._serialize_user_admin(u) for u in users]
        admin_count = sum(1 for u in data if u.get("is_admin"))
        return {
            "users": data,
            "total": total,
            "admin_count": admin_count,
            "page": page,
            "page_size": page_size,
        }

    def filter_users(self, db_session: Session, filter_criteria: UserUpdate, actor: models.User) -> List[Dict[str, Any]]:
        """Filter users based on given criteria (admin)."""
        if not self._has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        criteria = {k: v for k, v in filter_criteria.dict(exclude_unset=True).items() if v is not None}
        from sqlalchemy.orm import joinedload
        q = db_session.query(models.User).options(joinedload(models.User.permissions)).filter(
            models.User.is_deleted.is_(False)
        )
        if criteria.get("email"):
            q = q.filter(models.User.email.ilike(f"%{criteria['email']}%"))
        if criteria.get("name"):
            q = q.filter(models.User.name.ilike(f"%{criteria['name']}%"))
        users = q.limit(100).all()
        return [self._serialize_user_admin(u) for u in users]

    def list_permission_names(self, db_session: Session, actor: models.User) -> List[str]:
        """All permission names (admin)."""
        if not self._has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        rows = (
            db_session.query(models.Permission)
            .filter(models.Permission.is_deleted.is_(False))
            .order_by(models.Permission.name)
            .all()
        )
        return [p.name for p in rows]

    def grant_permission_to_user(
        self, db_session: Session, user_id: uuid.UUID, permission_name: str, actor: models.User
    ) -> Dict[str, Any]:
        if not self._has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        target = self._user_with_permissions(db_session, user_id)
        if not target:
            raise AuthErrorCode.USERNAME_NOT_FOUND.value
        permission = (
            db_session.query(models.Permission)
            .filter(models.Permission.name == permission_name, models.Permission.is_deleted.is_(False))
            .first()
        )
        if not permission:
            permission = models.Permission(name=permission_name, is_deleted=False)
            db_session.add(permission)
            db_session.flush()
        existing = db_session.query(UserHasPermission).filter_by(
            user_system_id=target.id,
            permission_id=permission.id,
            is_deleted=False,
        ).first()
        if not existing:
            db_session.add(
                UserHasPermission(
                    user_system_id=target.id,
                    permission_id=permission.id,
                    is_deleted=False,
                )
            )
            db_session.commit()
        refreshed = self._user_with_permissions(db_session, user_id)
        return self._serialize_user_admin(refreshed)

    def revoke_permission_from_user(
        self, db_session: Session, user_id: uuid.UUID, permission_name: str, actor: models.User
    ) -> Dict[str, Any]:
        if not self._has_admin_access(db_session, actor):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        if str(actor.id) == str(user_id) and permission_name in ADMIN_PERMISSION_NAMES:
            raise BEErrorCode.USER_NOT_PERMISSION.value
        target = self._user_with_permissions(db_session, user_id)
        if not target:
            raise AuthErrorCode.USERNAME_NOT_FOUND.value
        permission = (
            db_session.query(models.Permission)
            .filter(models.Permission.name == permission_name, models.Permission.is_deleted.is_(False))
            .first()
        )
        if permission:
            link = db_session.query(UserHasPermission).filter_by(
                user_system_id=target.id,
                permission_id=permission.id,
                is_deleted=False,
            ).first()
            if link:
                link.is_deleted = True
                db_session.commit()
        refreshed = self._user_with_permissions(db_session, user_id)
        return self._serialize_user_admin(refreshed)

    def get_user_by_access_token_me(self, db_session: Session, token: str) -> Union[models.User]:
        """Define get user by access token me."""
        try:
            if self.blacklist_token_repository.is_black_token(db_session, token):
                raise AuthErrorCode.BLACKLIST_TOKEN.value
            
            payload = jwt_decode_token(token)
            token_data = TokenPayload(**payload)
            
            if not token_data.sub:
                raise AuthErrorCode.INVALID_ACCESS_TOKEN.value
                
            user = self.user_repository.get_user_by_email(db_session, token_data.sub)
            if not user:
                raise AuthErrorCode.USERNAME_NOT_FOUND.value
                
            # Load permissions relationship
            from sqlalchemy.orm import joinedload
            user_with_permissions = db_session.query(models.User).options(
                joinedload(models.User.permissions)
            ).filter(models.User.id == user.id).first()
            
            # Lấy permissions của user
            permissions_data = [{'id': str(permission.id), 'name': permission.name} for permission in user_with_permissions.permissions]
            print(f"🔍 Debug - User {user.name} has {len(permissions_data)} permissions:")
            for perm in permissions_data:
                print(f"  - {perm['name']}")
            
            user_data = {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'avatar_url': user.avatar_url or None,
                'permissions': [permission['name'] for permission in permissions_data]  # Chỉ trả về tên permissions
            }
            print(f"🔍 Debug - Returning user data with {len(user_data['permissions'])} permissions")
            return user_data
        except Exception as e:
            print(f"Error in get_user_by_access_token_me: {str(e)}")
            raise e

    def update_current_user(
        self,
        db_session: Session,
        current_user: models.User,
        user_update: UserUpdate,
    ) -> Dict[str, Any]:
        """Update current user's own information."""
        update_data = {}
        if user_update.name is not None:
            update_data['name'] = user_update.name
        if user_update.email is not None:
            # Check if email already exists for another user
            existing_user = self.user_repository.get_user_by_email(db_session, user_update.email)
            if existing_user and existing_user.id != current_user.id:
                raise AuthErrorCode.EMAIL_EXISTED.value
            update_data['email'] = user_update.email
        if user_update.password is not None:
            update_data['password'] = get_password_hash(user_update.password).decode("utf-8")
        if user_update.avatar_url is not None:
            update_data['avatar_url'] = user_update.avatar_url
        
        if not update_data:
            raise BEErrorCode.USER_NOT_FOUND.value
        
        self.user_repository.update(db_session, obj_id=current_user.id, obj_in=update_data)
        updated_user = self.user_repository.get(db_session, current_user.id)
        
        # Load permissions
        from sqlalchemy.orm import joinedload
        user_with_permissions = db_session.query(models.User).options(
            joinedload(models.User.permissions)
        ).filter(models.User.id == updated_user.id).first()
        
        permissions_data = [{'id': str(permission.id), 'name': permission.name} for permission in user_with_permissions.permissions]
        
        return {
            'id': str(updated_user.id),
            'name': updated_user.name,
            'email': updated_user.email,
            'avatar_url': updated_user.avatar_url or None,
            'permissions': [permission['name'] for permission in permissions_data]
        }
    
    def change_password(
        self,
        db_session: Session,
        current_user: models.User,
        change_password_request: ChangePasswordRequest,
    ) -> Dict[str, Any]:
        """Change password for current user (requires old password verification)."""
        # Verify old password
        if not current_user.password:
            raise AuthErrorCode.INCORRECT_PASSWORD.value
        
        if not verify_password(change_password_request.old_password, current_user.password):
            raise AuthErrorCode.INCORRECT_PASSWORD.value
        
        # Check if new password is different from old password
        if change_password_request.old_password == change_password_request.new_password:
            raise HTTPException(status_code=400, detail="Mật khẩu mới phải khác mật khẩu cũ")
        
        # Validate new password length
        if len(change_password_request.new_password) < 6:
            raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự")
        
        # Hash new password
        hashed_password = get_password_hash(change_password_request.new_password)
        
        # Update password
        update_data = {'password': hashed_password.decode("utf-8")}
        self.user_repository.update(db_session, obj_id=current_user.id, obj_in=update_data)
        
        return {
            'message': 'Đổi mật khẩu thành công',
            'id': str(current_user.id)
        }
        
    def update_user_password(self, db_session: Session, user_id: uuid.UUID, user_update_password: ResetPasswordRequest, user) -> models.User:
        """Update an existing user."""
        roles = user.roles
        kt = 0
        for role in roles:
              if role.name in ["Admin"]:
                kt = 1
                if self.user_repository.get(db_session, user_id) is None:
                    raise BEErrorCode.USER_NOT_FOUND.value
                update_data = {key: value for key, value in user_update_password.__dict__.items() if value not in [None, 'string'] and key != 'token'}
                if 'password' in update_data:
                     update_data['password'] = get_password_hash(update_data['password']).decode("utf-8")
                user = self.user_repository.update(db_session, obj_id=user_id, obj_in=update_data)
                user = self.user_repository.get(db_session, user_id)
                data = {}
                roles_data = [{'id': str(role.id), 'name': role.name} for role in user.roles]
                user_data = {
                    'id': str(user.id),
                    'name': user.name,
                    'location': user.location,
                    'completion_rate': user.completion_rate,
                    'username': user.username,
                    'price': user.price,
                    'avatar': user.avatar,
                    'email': user.email,
                    'birthday': user.birthday,
                    'sex': user.sex,
                    'roles': roles_data
                    }
                
                data[str(user.id)] = user_data
                if not data:
                    raise BEErrorCode.USER_NOT_FOUND.value
                return data
        if kt == 0:
            raise BEErrorCode.USER_NOT_PERMISSION.value

    def get_user_settings(self, db_session: Session, user: models.User) -> Dict[str, Any]:
        """Đọc preferences JSONB + merge với mặc định."""
        u = self.user_repository.get(db_session, user.id)
        if not u:
            raise AuthErrorCode.USERNAME_NOT_FOUND.value
        raw = getattr(u, "preferences", None) or {}
        if not isinstance(raw, dict):
            raw = {}
        defaults = default_user_settings()
        merged: Dict[str, Any] = {**defaults, **raw}
        for k, v in defaults.items():
            if k not in merged:
                merged[k] = v
        return merged

    def patch_user_settings(
        self,
        db_session: Session,
        user: models.User,
        patch: UserSettingsUpdate,
    ) -> Dict[str, Any]:
        """Cập nhật một phần preferences (merge)."""
        incoming = patch.dict(exclude_unset=True)
        current = self.get_user_settings(db_session, user)
        current.update(incoming)
        self.user_repository.update(db_session, obj_id=user.id, obj_in={"preferences": current})
        return current

    async def send_reset_email(self, email: str, db: Session):
        stmt = select(User).where(User.email == email, User.is_deleted == False)
        result = db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        token = str(uuid4())
        expires_at = datetime.utcnow() + timedelta(minutes=30)

        user.reset_token = token
        user.reset_token_expires = expires_at
        db.commit()

        reset_url = f"{settings.FRONTEND_RESET_URL}?token={token}"
        await send_email( 
            to=email,
            subject="Reset your password",
            body=f"Click this link to reset your password:\n\n{reset_url}"
        )


    async def reset_user_password(token: str, new_password: str, db: AsyncSession):
        result = await db.execute(select(User).where(User.reset_token == token, User.is_deleted == False))
        user = result.scalar_one_or_none()

        if not user or user.reset_token_expires is None or user.reset_token_expires < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        user.password = get_password_hash(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        await db.commit()
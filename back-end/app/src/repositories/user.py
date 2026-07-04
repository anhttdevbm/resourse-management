"""doc."""
from typing import Any, Optional, Union
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.src.models.user import User
from app.core.database import get_db
from app.src import models
from app.src.exceptions.error_code import ServerErrorCode
from app.src.repositories.base_sql import BaseSQLRepository
from fastapi import Depends

class UserRepository(BaseSQLRepository[models.User]):
    """Define User System repository."""

    def get_user_by_email(self, session: Session, value: Any) -> Union[Optional[models.User]]:
        """Define method get user by email."""
        try:
            obj = session.query(self.model).filter(self.model.email == value,
                                                   self.model.is_deleted.is_(False)).first()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        return obj

    def add_permission_to_user(self, session: Session, user_id: int,
                               permission_id: int) -> Optional[models.UserHasPermission]:
        """Add permission to user."""
        try:
            user_system_has_permission_obj = models.UserHasPermission(user_system_id=user_id,
                                                                            permission_id=permission_id,
                                                                            is_deleted=False)
            session.add(user_system_has_permission_obj)
            session.commit()
            session.refresh(user_system_has_permission_obj)

        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        return user_system_has_permission_obj

    def get_permission_to_user(self, session: Session, value1: Any,
                               value2: Any) -> Optional[models.UserHasPermission]:
        """Get permission to user."""
        try:
            obj = session.query(self.model).filter(self.model.user_system_id == value1,
                                                   self.model.permission_id == value2,
                                                   self.model.is_deleted.is_(False)).first()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        return obj

    def get_all_paginated(self, session: Session, limit: int, offset: int) -> list[User]:
        try:
            data = session.query(self.model).filter(self.model.is_deleted.is_(False)).limit(limit).offset(offset).all()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        return data

    def count_all(self, session: Session) -> int:
        try:
            count = session.query(self.model).filter(self.model.is_deleted.is_(False)).count()
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        return count

    async def get_or_create_user_by_facebook(self, fb_data: dict, db: Session):
        user = db.query(User).filter_by(facebook_id=fb_data["id"]).first()

        if not user and fb_data.get("email"):
            user = db.query(User).filter_by(email=fb_data["email"]).first()
            if user:
                user.facebook_id = fb_data["id"]
                db.commit()
                db.refresh(user)
        if not user:
            user = User(
                name=fb_data["name"],
                email=fb_data.get("email"),
                password=None,
                facebook_id=fb_data["id"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Gán permissions cơ bản cho user mới
            await self._assign_basic_permissions(db, user)

        return user

    async def get_user_by_twitter_id(self, db: Session, twitter_id: str) -> User:
        return db.query(User).filter(User.twitter_id == twitter_id).first()

    @staticmethod
    def _twitter_placeholder_email(twitter_id: str) -> str:
        return f"{twitter_id}@twitter.oauth"

    async def create_user_from_twitter(self, db: Session, user_data: dict) -> User:
        user = User(
            twitter_id=user_data["id"],
            name=user_data["name"],
            email=user_data.get("email") or self._twitter_placeholder_email(user_data["id"]),
            password=None,
            avatar_url=user_data.get("profile_image_url"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Gán permissions cơ bản cho user mới
        await self._assign_basic_permissions(db, user)
        return user

    async def get_or_create_user_by_twitter(self, user_data: dict, db: Session) -> User:
        user = await self.get_user_by_twitter_id(db, user_data["id"])
        if user:
            return user
        # Nếu Twitter trả về email, kiểm tra user theo email
        email = user_data.get("email")
        if email:
            user = db.query(User).filter_by(email=email).first()
            if user:
                user.twitter_id = user_data["id"]
                db.commit()
                db.refresh(user)
                return user
        return await self.create_user_from_twitter(db, user_data)
    
    async def get_or_create_user_by_google(self, google_data: dict, db: Session):
        user = db.query(User).filter_by(google_id=google_data["id"]).first()
        if not user and google_data.get("email"):
            user = db.query(User).filter_by(email=google_data["email"]).first()
            if user:
                user.google_id = google_data["id"]
                db.commit()
                db.refresh(user)
        if not user:
            user = User(
                name=google_data.get("name"),
                email=google_data.get("email"),
                password=None,
                google_id=google_data["id"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Gán permissions cơ bản cho user mới
            await self._assign_basic_permissions(db, user)
        return user
    
    async def get_or_create_user_by_github(self, github_data: dict, db: Session):
        user = db.query(User).filter_by(github_id=str(github_data["id"])).first()
        if not user and github_data.get("email"):
            user = db.query(User).filter_by(email=github_data["email"]).first()
            if user:
                user.github_id = str(github_data["id"])
                db.commit()
                db.refresh(user)
        if not user:
            user = User(
                name=github_data.get("name") or github_data.get("login"),
                email=github_data.get("email"),
                password=None,
                github_id=str(github_data["id"])
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # Gán permissions cơ bản cho user mới
            await self._assign_basic_permissions(db, user)
        return user

    async def _assign_basic_permissions(self, db: Session, user: User):
        """Gán permissions cơ bản cho user mới."""
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
                permission = db.query(models.Permission).filter_by(name=permission_name, is_deleted=False).first()
                
                # Nếu permission chưa tồn tại, tạo mới
                if not permission:
                    permission = models.Permission(
                        name=permission_name,
                        is_deleted=False
                    )
                    db.add(permission)
                    db.flush()  # Flush để lấy ID
                    print(f"✅ Đã tạo permission mới: {permission_name}")
                
                # Kiểm tra xem user đã có permission này chưa
                existing = db.query(models.UserHasPermission).filter_by(
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
                    db.add(user_permission)
                    print(f"✅ Đã gán permission '{permission_name}' cho user {user.name}")
            
            db.commit()
            print(f"✅ Đã gán tất cả permissions cơ bản cho user {user.name} ({user.email})")
            
        except Exception as e:
            print(f"❌ Lỗi khi gán permissions cho user {user.name}: {str(e)}")
            import traceback
            traceback.print_exc()
            db.rollback()
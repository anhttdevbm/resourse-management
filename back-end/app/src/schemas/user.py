from typing import Optional
from pydantic import BaseModel, EmailStr

class UserLogin(BaseModel):
    """Schema define login data."""

    email: str
    password: str


class UserCreate(UserLogin):
    """Define User input schema to create user."""

    name: str


class UserPermissionPatch(BaseModel):
    """Grant or revoke a permission by name."""

    permission: str


class UserUpdate(BaseModel):
    """Define User input schema to update user."""

    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    """Schema for changing password (requires old password)."""
    old_password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
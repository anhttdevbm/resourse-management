from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserLogin(BaseModel):
    """Schema define login data."""

    email: str
    password: str


class UserCreate(UserLogin):
    """Define User input schema to create user."""

    name: str


class UserRegister(BaseModel):
    """Public self-registration."""

    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class UserPermissionPatch(BaseModel):
    """Grant or revoke a permission by name."""

    permission: str


class UserUpdate(BaseModel):
    """Define User input schema to update user."""

    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None
    is_locked: Optional[bool] = None

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
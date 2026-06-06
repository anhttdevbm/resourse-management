"""Define Token schema."""
from typing import Optional

from pydantic import BaseModel


class TokenPayload(BaseModel):
    """Define Token payload schema."""

    sub: Optional[str] = None
    key: Optional[str] = None


class RefreshToken(BaseModel):
    """Schema define refresh access token input data."""

    refresh_token: str

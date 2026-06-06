"""Define token schemas."""
from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    """Define token."""

    access_token: str
    token_type: str
    role: Optional[str] = None


class TokenPayload(BaseModel):
    """Define token pay load."""

    sub: Optional[int] = None


class BlackListToken(BaseModel):
    """Define black list token."""

    token: str


class Session(BaseModel):
    """Define session."""

    access_token: str
    refresh_token: str
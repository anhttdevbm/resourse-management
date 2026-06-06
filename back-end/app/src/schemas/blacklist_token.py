"""Define blacklist token schema."""
from pydantic import BaseModel


class BlackListTokenCreate(BaseModel):
    """Schema define token value to add token black list."""

    token: str
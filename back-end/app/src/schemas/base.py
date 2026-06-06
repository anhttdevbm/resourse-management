"""Define Base schema."""

from datetime import datetime
from typing import Optional, Union

from pydantic import BaseModel, validator


class Paging(BaseModel):
    """Define Paging."""

    offset: Optional[int]
    limit: Optional[int]


class DateBetween(BaseModel):
    """Define DateBetween."""

    from_date: datetime
    to_date: datetime

    @validator('from_date', 'to_date', pre=True)
    def parse_date(cls, value: Union[str, datetime]) -> datetime:
        """Define parse_date."""
        if isinstance(value, str):
            return datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
        return value
1
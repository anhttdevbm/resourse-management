"""Define base model."""
# mypy: ignore-errors
import re
from typing import Any

from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm.collections import InstrumentedList


class Base(DeclarativeBase):
    """Models of base."""

    id: Any  # noqa
    is_deleted: Any

    # Generate __tablename__ automatically
    @declared_attr
    def __tablename__(cls) -> str:
        """Customize __tablename__.

        Description here
        """
        word_list = re.findall('[A-Z][^A-Z]*', cls.__name__)
        return "_".join(word_list).lower() + "s"

    def to_dict(self) -> dict[str, Any]:
        """Recursively converts DB object instance to python dictionary."""
        result = self.__dict__
        if "is_deleted" in result:
            del result["is_deleted"]
        if "password" in result:
            del result["password"]
        for k, v in result.items():
            if isinstance(v, InstrumentedList):
                result[k] = [obj.to_dict() for obj in v]
        return result

"""doc."""
import uuid
from datetime import datetime
from typing import Any, Dict

from app.src.models.base_model import Base


def row2dict(row: Base) -> Dict[str, Any]:
    """doc."""
    d = {}
    for column in row.__table__.columns:
        if column.name not in ["password", "is_deleted", "updated_at"]:
            d[column.name] = str(getattr(row, column.name))

    return d


def generate_uuid() -> uuid.UUID:
    """doc."""
    return uuid.uuid5(uuid.NAMESPACE_DNS, str(datetime.now()))
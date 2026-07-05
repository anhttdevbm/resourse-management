"""doc."""
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel

from app.src.models.base_model import Base


def pydantic_to_dict(model: BaseModel, *, exclude_unset: bool = False) -> Dict[str, Any]:
    """Pydantic v1 (.dict) và v2 (model_dump)."""
    if hasattr(model, "model_dump"):
        return model.model_dump(exclude_unset=exclude_unset)
    return model.dict(exclude_unset=exclude_unset)  # type: ignore[call-arg]


def row2dict(row: Base) -> Dict[str, Any]:
    """doc."""
    d = {}
    for column in row.__table__.columns:
        if column.name not in ["password", "is_deleted", "updated_at"]:
            val = getattr(row, column.name, None)
            d[column.name] = str(val) if val is not None else None

    return d


def generate_uuid() -> uuid.UUID:
    """doc."""
    return uuid.uuid5(uuid.NAMESPACE_DNS, str(datetime.now()))
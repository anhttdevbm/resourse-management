"""doc."""
from typing import Any

from app.src.schemas.base import Paging


class PagingPopulator(object):
    """doc."""

    @staticmethod
    def populate(req: Any) -> Paging:
        """doc."""
        return Paging(offset=req.offset if req.offset else 1, limit=req.limit if req.limit else 10)
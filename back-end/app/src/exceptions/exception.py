"""Define exception file."""
import traceback

import decouple
from starlette import status

from app.src.schemas.response import ExceptionDetail

ENV = decouple.config("ENV", "DEV")


def get_traceback(ex: Exception) -> str:
    """doc."""
    lines = traceback.format_exception(type(ex), ex, ex.__traceback__)
    return ''.join(lines)


class BusinessException(Exception):  # noqa
    """doc."""

    def __init__(self, exception: ExceptionDetail, status_code: int = status.HTTP_400_BAD_REQUEST):
        """Define constructor for BusinessException object."""
        self.status_code = status_code
        self.code = exception.code if exception.code else str(self.status_code)
        self.message = exception.message
        self.data = exception.data

    def __call__(self, exception: Exception) -> Exception:
        """Define __call__ method for BusinessException object."""
        self.data = {"data": get_traceback(exception)} if ENV == "DEV" else {"data": ""}
        return self

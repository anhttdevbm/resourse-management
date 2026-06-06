"""read and write with file."""
import json
from typing import Any


class BaseIO(object):
    """doc."""

    @staticmethod
    def read(filename: str, mode: str = "r", encoding: str = "utf-8") -> Any:
        """Define base method."""


class JsonIO(BaseIO):
    """doc."""

    @staticmethod
    def read(filename: str, mode: str = "r", encoding: str = "utf-8") -> Any:
        """Read file json."""
        with open(filename, mode, encoding=encoding) as file:
            return json.load(file)

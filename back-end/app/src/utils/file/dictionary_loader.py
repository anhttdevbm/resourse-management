"""Class load data from file."""
from typing import Any

from app.src.utils.file.file_io import JsonIO


class JsonDictionaryLoader(object):
    """doc."""

    def __init__(self) -> None:
        """doc."""
        self.io = JsonIO()

    def load(self, filepath: str) -> Any:
        """Load data from file json."""
        content = self.io.read(filepath)
        return content

"""doc."""
from typing import Any, Dict


class Singleton(type):
    """doc."""

    _instances: Dict[Any, Any] = {}

    def __call__(cls, *args: Any, **kwargs: Any) -> Any:
        """doc."""
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]
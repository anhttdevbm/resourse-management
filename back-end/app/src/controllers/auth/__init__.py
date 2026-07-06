from .deps import auth_routers, user_service
from . import login, oauth, password, register  # noqa: F401 — register routes on auth_routers

__all__ = ["auth_routers", "user_service"]

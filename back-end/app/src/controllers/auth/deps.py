from decouple import config
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from app.src.models import User
from app.src.repositories.user import UserRepository
from app.src.services.auth_service import AuthService
from app.src.utils.email_service import EmailService
from app.src.services.user_service import UserService

user_service = UserService()
user_repository = UserRepository(User)
auth_service = AuthService()
email_service = EmailService()
auth_routers = APIRouter()


def public_url() -> str:
    return config("PUBLIC_URL", default="http://localhost:5173").rstrip("/")


def oauth_redirect_target(request: Request) -> str:
    referer = request.headers.get("referer", "")
    if "forgot-password" in referer:
        return f"{public_url()}/forgot-password"
    return f"{public_url()}/login"


def redirect_account_locked() -> RedirectResponse:
    return RedirectResponse(
        url=f"{public_url()}/login?error=account_locked&message=Account%20is%20locked",
        status_code=302,
    )

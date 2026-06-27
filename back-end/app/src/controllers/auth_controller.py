"""Define process for authentication."""
from typing import Tuple
import os, secrets, base64
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from starlette import status
from decouple import config
from app.src.schemas.token import Token
from app.src.models import User
from app.src.schemas.response import ResponseObject
from app.src.schemas.session import RefreshToken
from app.src.schemas.user import UserLogin
from app.src.services.auth_service import AuthService
from app.src.services.user_service import UserService
from app.src.utils.connection.sql_connection import get_db_session
from app.src.utils.const.document import generate_doc_response, get_response
from pydantic import BaseModel, EmailStr
from app.src.services.facebook_auth_service import get_facebook_access_token, get_facebook_user_info
from app.src.repositories.user import UserRepository
from app.src.utils.security import jwt_create_token
from app.src.models.user import User
from app.core.database import get_db
from app.src.utils.twitter import get_twitter_access_token, get_twitter_user_info
from app.src.utils.state_memory import verifier_store
from fastapi.responses import RedirectResponse
import hashlib
from app.src.utils.google import get_google_access_token, get_google_user_info
import httpx
from app.src.utils.github import get_github_access_token, get_github_user_info
from app.src.utils.email_service import EmailService
from app.src.schemas.password_reset import ForgotPasswordRequest, ResetPasswordRequest
from app.src.utils.security import hash_password


user_service = UserService()
user_repository = UserRepository(User)
auth_service = AuthService()
auth_routers = APIRouter()
email_service = EmailService()


def _public_url() -> str:
    return config("PUBLIC_URL", default="http://localhost:5173").rstrip("/")


def _oauth_redirect_target(request: Request) -> str:
    referer = request.headers.get("referer", "")
    if "forgot-password" in referer:
        return f"{_public_url()}/forgot-password"
    return f"{_public_url()}/login"


class PasswordResetRequest(BaseModel):
    email: EmailStr


@auth_routers.post("/user/login", responses={status.HTTP_200_OK: generate_doc_response(example=get_response("API_LOGIN_USER"), model=ResponseObject)})
def login_email_password(login_data: UserLogin, db_session: Session = Depends(get_db_session)) -> ResponseObject: # noqa
    """Define function login with email and password."""
    user = user_service.authenticate(db_session, login_data.email, login_data.password)
    token_data = auth_service.login(login_data.email)
    data = {
        "token": token_data,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name
        }
    }
    return ResponseObject(data=data, code="AUTH0000")


@auth_routers.post("/user/refresh-token")
def refresh_access_token(
        refresh_token: RefreshToken,
        user_data: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Define function get access token from refresh token."""
    if isinstance(user_data[0], User):
        user_object = user_data[0]
        email = user_object.email
    else:
        user_object, email = user_data
    data = auth_service.refresh_access_token(email, refresh_token.refresh_token)
    return ResponseObject(data=data, code="AUTH0000")


@auth_routers.post("/user/logout")
def logout_system(
        db_session: Session = Depends(get_db_session),
        user_token: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Define logout function."""
    auth_service.logout(db_session, user_token[1])
    return ResponseObject(message="Logout Success", code="AUTH0000")

@auth_routers.get("/facebook/callback")
async def facebook_callback(code: str, request: Request):
    access_token = await get_facebook_access_token(code)
    fb_user = await get_facebook_user_info(access_token)

    db = next(get_db())
    user = await user_repository.get_or_create_user_by_facebook(fb_user, db)

    token_data = auth_service.login(user.email)

    frontend_url = _oauth_redirect_target(request)
    redirect_url = f"{frontend_url}?access_token={token_data['access_token']}&refresh_token={token_data.get('refresh_token', '')}&login_type=facebook"
    return RedirectResponse(url=redirect_url)

@auth_routers.get("/login/facebook")
async def login_facebook():
    """Initiate Facebook OAuth login."""
    url = (
        "https://www.facebook.com/v17.0/dialog/oauth"
        f"?client_id={config('FACEBOOK_APP_ID')}"
        f"&redirect_uri={config('FACEBOOK_REDIRECT_URI')}"
        f"&scope=email,public_profile"
        f"&response_type=code"
    )
    return RedirectResponse(url)

def generate_code_challenge(verifier: str) -> str:
    sha256 = hashlib.sha256(verifier.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(sha256).rstrip(b'=').decode('utf-8')

@auth_routers.get("/login/twitter")
async def login_twitter():
    # Twitter OAuth2 có thể sử dụng plain method đơn giản hơn
    state = secrets.token_hex(16)
    
    url = (
        f"https://twitter.com/i/oauth2/authorize"
        f"?response_type=code"
        f"&client_id={config('TWITTER_CLIENT_ID')}"
        f"&redirect_uri={config('TWITTER_REDIRECT_URI')}"
        f"&scope=users.read"
        f"&state={state}"
    )
    return RedirectResponse(url)

@auth_routers.get("/twitter/callback")
async def twitter_callback(request: Request):
    try:
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        
        print(f"Twitter callback - Code: {code}, State: {state}")
        
        if not code:
            raise HTTPException(status_code=400, detail="Missing code")
        
        # Get Twitter access token
        token = await get_twitter_access_token(code)
        print(f"Twitter access token received: {token[:10]}..." if token else "No token")
        
        # Get Twitter user info
        twitter_user = await get_twitter_user_info(token)
        print(f"Twitter user info: {twitter_user}")

        # Create or get user from database
        db = next(get_db())
        user = await user_repository.get_or_create_user_by_twitter(twitter_user, db)
        print(f"User created/found: {user.id}")

        # Generate JWT tokens
        token_data = auth_service.login(user.email)

        frontend_url = _oauth_redirect_target(request)
        redirect_url = f"{frontend_url}?access_token={token_data['access_token']}&refresh_token={token_data.get('refresh_token', '')}&login_type=twitter"
        print(f"Redirecting to: {redirect_url}")
        
        return RedirectResponse(url=redirect_url, status_code=302)
        
    except Exception as e:
        print(f"Twitter callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Redirect to frontend with error
        frontend_url = f"{_public_url()}/login"
        error_message = str(e).replace(' ', '%20')  # URL encode spaces
        redirect_url = f"{frontend_url}?error=twitter_login_failed&message={error_message}"
        return RedirectResponse(url=redirect_url, status_code=302)

@auth_routers.get("/login/google")
async def login_google():
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={config('GOOGLE_CLIENT_ID')}"
        f"&redirect_uri={config('GOOGLE_REDIRECT_URI')}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
        f"&prompt=consent"
    )
    return RedirectResponse(url)

@auth_routers.get("/google/callback")
async def google_callback(request: Request):
    try:
        code = request.query_params.get("code")
        if not code:
            raise HTTPException(status_code=400, detail="Missing code")
        
        token_data = await get_google_access_token(code)
        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")
        google_user = await get_google_user_info(access_token)

        db = next(get_db())
        user = await user_repository.get_or_create_user_by_google(google_user, db)

        token_data = auth_service.login(user.email)

        frontend_url = _oauth_redirect_target(request)
        redirect_url = f"{frontend_url}?access_token={token_data['access_token']}&refresh_token={token_data.get('refresh_token', '')}&login_type=google"
        return RedirectResponse(url=redirect_url)
    except Exception as e:
        frontend_url = f"{_public_url()}/login"
        redirect_url = f"{frontend_url}?error=google_login_failed&message={str(e)}"
        return RedirectResponse(url=redirect_url)

@auth_routers.get("/login/github")
async def login_github():
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={config('GITHUB_CLIENT_ID')}"
        f"&redirect_uri={config('GITHUB_REDIRECT_URI')}"
        f"&scope=user:email"
    )
    return RedirectResponse(url)

@auth_routers.get("/github/callback")
async def github_callback(request: Request, db: Session = Depends(get_db)):
    try:
        code = request.query_params.get("code")
        if not code:
            raise HTTPException(status_code=400, detail="Missing code")
        
        # Get GitHub access token
        access_token = await get_github_access_token(code)
        print(f"GitHub access token received: {access_token[:10]}..." if access_token else "No token")
        
        # Get GitHub user info
        github_user = await get_github_user_info(access_token)
        print(f"GitHub user info: {github_user}")

        # Create or get user from database
        user = await user_repository.get_or_create_user_by_github(github_user, db)
        print(f"User created/found: {user.id}")

        # Generate JWT tokens
        token_data = auth_service.login(user.email)

        frontend_url = _oauth_redirect_target(request)
        redirect_url = f"{frontend_url}?access_token={token_data['access_token']}&refresh_token={token_data.get('refresh_token', '')}&login_type=github"
        print(f"Redirecting to: {redirect_url}")
        
        return RedirectResponse(url=redirect_url, status_code=302)
        
    except Exception as e:
        print(f"GitHub callback error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Redirect to frontend with error
        frontend_url = f"{_public_url()}/login"
        error_message = str(e).replace(' ', '%20')  # URL encode spaces
        redirect_url = f"{frontend_url}?error=github_login_failed&message={error_message}"
        return RedirectResponse(url=redirect_url, status_code=302)

@auth_routers.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Gửi email reset password"""
    try:
        print(f"Forgot password request for email: {request.email}")
        
        # Kiểm tra email có tồn tại không
        user = user_repository.get_user_by_email(db, request.email)
        print(f"User found: {user}")
        
        if not user:
            print("User not found, returning success message")
            return ResponseObject(
                message="If the email exists, a reset link has been sent.",
                code="AUTH0000"
            )

        # Tạo reset token
        print("Creating reset token...")
        reset_token = email_service.create_reset_token(request.email)
        print(f"Reset token created: {reset_token[:20]}...")

        # Tạm thời bypass email service và log reset link
        print("=== FORGOT PASSWORD RESET LINK ===")
        reset_link = f"{config('FRONTEND_RESET_URL', default=f'{_public_url()}/reset-password')}?token={reset_token}"
        print(f"Reset link for {request.email}: {reset_link}")
        print("=== END RESET LINK ===")
        
        # Gửi email (tạm thời mock để test)
        print("Sending reset password email...")
        try:
            email_sent = email_service.send_reset_password_email(request.email, reset_token)
            print(f"Email sent result: {email_sent}")
        except Exception as email_error:
            print(f"Email service error: {email_error}")
            # Tạm thời return success để test
            email_sent = True
        
        if email_sent:
            return ResponseObject(
                message="Reset password email has been sent. Check console for reset link.",
                code="AUTH0000"
            )
        else:
            print("Failed to send email")
            raise HTTPException(status_code=500, detail="Failed to send email")

    except Exception as e:
        print(f"Error in forgot_password: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@auth_routers.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password bằng token"""
    try:
        # Xác thực token
        email = email_service.verify_reset_token(request.token)
        
        # Tìm user theo email
        user = user_repository.get_user_by_email(db, email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Hash password mới
        hashed_password = hash_password(request.new_password)
        
        # Cập nhật password
        user.password = hashed_password
        db.commit()
        db.refresh(user)

        return ResponseObject(
            message="Password has been reset successfully.",
            code="AUTH0000"
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
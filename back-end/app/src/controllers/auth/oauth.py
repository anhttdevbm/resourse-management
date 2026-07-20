import base64
import hashlib
import secrets

from decouple import config
from fastapi import Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.src.services.facebook_auth_service import (
    get_facebook_access_token,
    get_facebook_user_info,
)
from app.src.utils.github import get_github_access_token, get_github_user_info
from app.src.utils.google import get_google_access_token, get_google_user_info
from app.src.utils.twitter import get_twitter_access_token, get_twitter_user_info

from .deps import (
    auth_routers,
    auth_service,
    oauth_redirect_target,
    public_url,
    redirect_account_locked,
    user_repository,
)


def generate_code_challenge(verifier: str) -> str:
    sha256 = hashlib.sha256(verifier.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(sha256).rstrip(b"=").decode("utf-8")


def oauth_redirect_with_tokens(frontend_url: str, token_data: dict, login_type: str) -> RedirectResponse:
    """Put JWTs in URL hash fragment so they are not sent to servers/proxies/logs."""
    from urllib.parse import quote

    access = quote(token_data["access_token"], safe="")
    refresh = quote(token_data.get("refresh_token", ""), safe="")
    redirect_url = (
        f"{frontend_url}#access_token={access}"
        f"&refresh_token={refresh}&login_type={login_type}"
    )
    return RedirectResponse(url=redirect_url, status_code=302)


@auth_routers.get("/facebook/callback")
async def facebook_callback(request: Request):
    error = request.query_params.get("error") or request.query_params.get("error_message")
    if error:
        msg = request.query_params.get("error_message", error).replace(" ", "%20")
        return RedirectResponse(
            url=f"{public_url()}/login?error=facebook_login_failed&message={msg}",
            status_code=302,
        )

    code = request.query_params.get("code")
    if not code:
        return RedirectResponse(
            url=f"{public_url()}/login?error=facebook_login_failed&message=missing_code",
            status_code=302,
        )

    access_token = await get_facebook_access_token(code)
    fb_user = await get_facebook_user_info(access_token)

    db = next(get_db())
    user = await user_repository.get_or_create_user_by_facebook(fb_user, db)
    if getattr(user, "is_locked", False):
        return redirect_account_locked()

    token_data = auth_service.login(user.email)
    return oauth_redirect_with_tokens(oauth_redirect_target(request), token_data, "facebook")



@auth_routers.get("/login/facebook")
async def login_facebook():
    url = (
        "https://www.facebook.com/v17.0/dialog/oauth"
        f"?client_id={config('FACEBOOK_APP_ID')}"
        f"&redirect_uri={config('FACEBOOK_REDIRECT_URI')}"
        f"&scope=email,public_profile"
        f"&response_type=code"
    )
    return RedirectResponse(url)


@auth_routers.get("/login/twitter")
async def login_twitter(request: Request):
    state = secrets.token_urlsafe(16)
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = generate_code_challenge(code_verifier)
    request.session["twitter_oauth"] = {
        "state": state,
        "code_verifier": code_verifier,
    }

    url = (
        "https://twitter.com/i/oauth2/authorize"
        f"?response_type=code"
        f"&client_id={config('TWITTER_CLIENT_ID')}"
        f"&redirect_uri={config('TWITTER_REDIRECT_URI')}"
        f"&scope=tweet.read%20users.read"
        f"&state={state}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
    )
    return RedirectResponse(url)


@auth_routers.get("/twitter/callback")
async def twitter_callback(request: Request):
    try:
        code = request.query_params.get("code")
        state = request.query_params.get("state")

        if not code:
            raise HTTPException(status_code=400, detail="Missing code")
        if not state:
            raise HTTPException(status_code=400, detail="Missing state")

        oauth_session = request.session.pop("twitter_oauth", None)
        if not oauth_session or oauth_session.get("state") != state:
            raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

        code_verifier = oauth_session["code_verifier"]
        token = await get_twitter_access_token(code, code_verifier)
        twitter_user = await get_twitter_user_info(token)

        db = next(get_db())
        user = await user_repository.get_or_create_user_by_twitter(twitter_user, db)
        if getattr(user, "is_locked", False):
            return redirect_account_locked()

        token_data = auth_service.login(user.email)
        return oauth_redirect_with_tokens(oauth_redirect_target(request), token_data, "twitter")


    except Exception as e:
        print(f"Twitter callback error: {str(e)}")
        import traceback

        traceback.print_exc()

        frontend_url = f"{public_url()}/login"
        error_message = str(e).replace(" ", "%20")
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
        google_user = await get_google_user_info(access_token)

        db = next(get_db())
        user = await user_repository.get_or_create_user_by_google(google_user, db)
        if getattr(user, "is_locked", False):
            return redirect_account_locked()

        token_data = auth_service.login(user.email)
        return oauth_redirect_with_tokens(oauth_redirect_target(request), token_data, "google")

    except Exception as e:
        frontend_url = f"{public_url()}/login"
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

        access_token = await get_github_access_token(code)
        print(f"GitHub access token received: {access_token[:10]}..." if access_token else "No token")

        github_user = await get_github_user_info(access_token)
        print(f"GitHub user info: {github_user}")

        user = await user_repository.get_or_create_user_by_github(github_user, db)
        if getattr(user, "is_locked", False):
            return redirect_account_locked()

        token_data = auth_service.login(user.email)
        return oauth_redirect_with_tokens(oauth_redirect_target(request), token_data, "github")

    except Exception as e:
        print(f"GitHub callback error: {str(e)}")
        import traceback

        traceback.print_exc()

        frontend_url = f"{public_url()}/login"
        error_message = str(e).replace(" ", "%20")
        redirect_url = f"{frontend_url}?error=github_login_failed&message={error_message}"
        return RedirectResponse(url=redirect_url, status_code=302)

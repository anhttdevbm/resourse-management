import base64

import httpx
from decouple import config


def _twitter_credentials() -> tuple[str, str | None, str]:
    return (
        config("TWITTER_CLIENT_ID"),
        config("TWITTER_CLIENT_SECRET", default="") or None,
        config("TWITTER_REDIRECT_URI"),
    )


def _twitter_error_detail(response: httpx.Response) -> str:
    try:
        payload = response.json()
        if isinstance(payload, dict):
            detail = payload.get("detail") or payload.get("title") or payload.get("error_description")
            if detail:
                return str(detail)
            errors = payload.get("errors")
            if errors:
                return str(errors)
    except Exception:
        pass
    return response.text or response.reason_phrase


async def get_twitter_access_token(code: str, verifier: str) -> str:
    client_id, client_secret, redirect_uri = _twitter_credentials()
    async with httpx.AsyncClient() as client:
        data = {
            "client_id": client_id,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "code_verifier": verifier,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        if client_secret:
            basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
            headers["Authorization"] = f"Basic {basic}"

        response = await client.post(
            "https://api.twitter.com/2/oauth2/token",
            data=data,
            headers=headers,
        )
        if response.is_error:
            raise RuntimeError(
                f"Twitter token exchange failed ({response.status_code}): "
                f"{_twitter_error_detail(response)}"
            )

        token_payload = response.json()
        granted_scopes = token_payload.get("scope", "")
        if granted_scopes and "users.read" not in granted_scopes:
            raise RuntimeError(
                "Twitter token missing users.read scope. "
                f"Granted scopes: {granted_scopes}. "
                "Enable users.read and tweet.read in X Developer Portal OAuth 2.0 settings."
            )

        return token_payload["access_token"]


async def get_twitter_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.twitter.com/2/users/me",
            params={"user.fields": "id,name,username,profile_image_url,email"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if response.is_error:
            raise RuntimeError(
                f"Twitter user lookup failed ({response.status_code}): "
                f"{_twitter_error_detail(response)}"
            )
        return response.json()["data"]

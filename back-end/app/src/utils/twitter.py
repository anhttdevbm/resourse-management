import os
import httpx

TWITTER_CLIENT_ID = os.getenv("TWITTER_CLIENT_ID")
TWITTER_CLIENT_SECRET = os.getenv("TWITTER_CLIENT_SECRET")
TWITTER_REDIRECT_URI = os.getenv("TWITTER_REDIRECT_URI")


async def get_twitter_access_token(code: str, verifier: str) -> str:
    async with httpx.AsyncClient() as client:
        data = {
            "client_id": TWITTER_CLIENT_ID,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": TWITTER_REDIRECT_URI,
            "code_verifier": verifier,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        if TWITTER_CLIENT_SECRET:
            import base64
            basic = base64.b64encode(
                f"{TWITTER_CLIENT_ID}:{TWITTER_CLIENT_SECRET}".encode()
            ).decode()
            headers["Authorization"] = f"Basic {basic}"

        response = await client.post(
            "https://api.twitter.com/2/oauth2/token",
            data=data,
            headers=headers,
        )
        response.raise_for_status()
        return response.json()["access_token"]


async def get_twitter_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.twitter.com/2/users/me",
            params={"user.fields": "id,name,username,profile_image_url"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()["data"]

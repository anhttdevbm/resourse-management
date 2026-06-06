from decouple import config
import httpx

GITHUB_CLIENT_ID = config("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = config("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = config("GITHUB_REDIRECT_URI")

async def get_github_access_token(code: str) -> str:
    async with httpx.AsyncClient() as client:
        print(GITHUB_CLIENT_ID)
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"}
        )
        response.raise_for_status()
        return response.json()["access_token"]

async def get_github_user_info(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        response.raise_for_status()
        user_data = response.json()
        # Lấy email nếu chưa có
        if not user_data.get("email"):
            email_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            email_resp.raise_for_status()
            emails = email_resp.json()
            primary_email = next((e["email"] for e in emails if e.get("primary")), None)
            user_data["email"] = primary_email
        return user_data
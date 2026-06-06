import httpx
import os
from decouple import config

FACEBOOK_APP_ID = config("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = config("FACEBOOK_APP_SECRET")
REDIRECT_URI = config("FACEBOOK_REDIRECT_URI")

async def get_facebook_access_token(code: str):
    url = "https://graph.facebook.com/v17.0/oauth/access_token"
    params = {
        "client_id": FACEBOOK_APP_ID,
        "redirect_uri": REDIRECT_URI,
        "client_secret": FACEBOOK_APP_SECRET,
        "code": code,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()["access_token"]

async def get_facebook_user_info(access_token: str):
    url = "https://graph.facebook.com/me"
    params = {
        "fields": "id,name,email,picture",
        "access_token": access_token,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()

"""doc."""
import logging
from json import dumps

import decouple
import requests
from fastapi import Request
from fastapi.responses import JSONResponse

from app.src.exceptions.exception import BusinessException

GOOGLE_CHAT_WEBHOOK = decouple.config("GOOGLE_CHAT_WEBHOOK", "")


async def business_exception_handler(_: Request, exc: BusinessException) -> JSONResponse:
    """doc."""
    logging.error(f"{exc.message}\n{exc.data}")
    if GOOGLE_CHAT_WEBHOOK:
        requests.post(url=GOOGLE_CHAT_WEBHOOK,
                      data=dumps({"text": f"RABILOO EKYC\n{exc.message}\n{exc.data}"}),
                      headers={'Content-Type': 'application/json; charset=UTF-8'})
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message, "data": exc.data},
    )

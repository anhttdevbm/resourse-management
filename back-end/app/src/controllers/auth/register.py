from decouple import config
from fastapi import Depends
from sqlalchemy.orm import Session
from starlette import status

from app.src.exceptions.error_code import BEErrorCode
from app.src.schemas.response import ResponseObject
from app.src.schemas.user import UserCreate, UserRegister
from app.src.utils.connection.sql_connection import get_db_session
from app.src.utils.const.document import generate_doc_response, get_response

from .deps import auth_routers, auth_service, user_service


@auth_routers.post(
    "/user/register",
    responses={
        status.HTTP_200_OK: generate_doc_response(
            example=get_response("API_LOGIN_USER"), model=ResponseObject
        )
    },
)
def register_user(
    body: UserRegister,
    db_session: Session = Depends(get_db_session),
) -> ResponseObject:
    enabled = config("ENABLE_PUBLIC_REGISTRATION", default=True, cast=bool)
    if not enabled:
        raise BEErrorCode.USER_NOT_PERMISSION.value

    user = user_service.create_user(
        db_session,
        UserCreate(
            name=body.name.strip(),
            email=str(body.email).strip().lower(),
            password=body.password,
        ),
        actor=None,
    )
    token_data = auth_service.login(user.email)
    data = {
        "token": token_data,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
        },
    }
    return ResponseObject(data=data, code="AUTH0000", message="Registration successful")

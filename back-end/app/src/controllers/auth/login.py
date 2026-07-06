from typing import Tuple

from fastapi import Depends
from sqlalchemy.orm import Session
from starlette import status

from app.src.models import User
from app.src.schemas.response import ResponseObject
from app.src.schemas.session import RefreshToken
from app.src.schemas.user import UserLogin
from app.src.utils.connection.sql_connection import get_db_session
from app.src.utils.const.document import generate_doc_response, get_response

from .deps import auth_routers, auth_service, user_service


@auth_routers.post(
    "/user/login",
    responses={
        status.HTTP_200_OK: generate_doc_response(
            example=get_response("API_LOGIN_USER"), model=ResponseObject
        )
    },
)
def login_email_password(
    login_data: UserLogin, db_session: Session = Depends(get_db_session)
) -> ResponseObject:
    user = user_service.authenticate(db_session, login_data.email, login_data.password)
    token_data = auth_service.login(login_data.email)
    data = {
        "token": token_data,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
        },
    }
    return ResponseObject(data=data, code="AUTH0000")


@auth_routers.post("/user/refresh-token")
def refresh_access_token(
    refresh_token: RefreshToken,
    user_data: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
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
    auth_service.logout(db_session, user_token[1])
    return ResponseObject(message="Logout Success", code="AUTH0000")

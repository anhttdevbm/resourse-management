"""Define auth service file."""
from typing import Dict
import decouple
from sqlalchemy.orm import Session
from app.src.exceptions.error_code import AuthErrorCode
from app.src.models import BlacklistToken, User
from app.src.repositories.blacklist_token import BlackListTokenRepository
from app.src.repositories.user import UserRepository
from app.src.schemas.blacklist_token import BlackListTokenCreate
from app.src.schemas.session import TokenPayload
from app.src.utils.security import jwt_create_token, jwt_decode_token
from ssl import create_default_context
from email.mime.text import MIMEText
from smtplib import SMTP, SMTPException
from app.src.schemas.mail import MailBody



REFRESH_TOKEN_EXPIRE_MINUTES = decouple.config("REFRESH_TOKEN_EXPIRE_MINUTES", 300)

class AuthService(object):
    """Define auth service object."""

    def __init__(self) -> None:
        """Define constructor for Auth service object."""
        self.user_repository = UserRepository(User)
        self.blacklist_token_repository = BlackListTokenRepository(BlacklistToken)

    def send_mail(self, data: dict = None):
        msg = MailBody(**data)
        message = MIMEText(msg.body, "html")
        message["From"] = MAIL_USERNAME
        message["To"] = ",".join(msg.to)
        message["Subject"] = msg.subject

        ctx = create_default_context()

        try:
            with SMTP(MAIL_HOST, MAIL_PORT) as server:
                server.ehlo()
                server.starttls(context=ctx)
                server.ehlo()
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
                server.send_message(message)
                server.quit()
                return {"status": 200, "errors": None}
        except SMTPException as e:
            return {"status": 500, "errors": f"SMTP error: {str(e)}"}
        except Exception as e:
            return {"status": 500, "errors": str(e)}

    @staticmethod
    def login(val_input: str) -> Dict[str, str]:
        """Issue access and refresh JWT tokens."""
        access_token = jwt_create_token(val_input)
        refresh_token = jwt_create_token(val_input, expires_minutes=int(REFRESH_TOKEN_EXPIRE_MINUTES))
        return {"access_token": access_token, "refresh_token": refresh_token}

    def refresh_access_token(self, val_input: str, refresh_token: str) -> Dict[str, str]:
        """Define refresh access token method."""
        token_data = jwt_decode_token(refresh_token)
        token_payload = TokenPayload(**token_data)
        if token_payload.sub != val_input:
            raise AuthErrorCode.INVALID_ACCESS_TOKEN.value
        return self.login(val_input)

    def logout(self, db_session: Session, token: str) -> None:
        """Define logout method."""
        token_data = jwt_decode_token(token)
        token_payload = TokenPayload(**token_data)
        if not self.user_repository.get_user_by_email(db_session, token_payload.sub):
            raise AuthErrorCode.INVALID_ACCESS_TOKEN.value
        self.blacklist_token_repository.create(db_session, obj_in=BlackListTokenCreate(token=token))

    def handle_forgot_password(self, db_session: Session, email: str):
        user = self.user_repository.get_user_by_email(db_session, email)
        if not user:
            return None
        token = self.create_reset_token(email)
        print(f"Reset link: http://192.168.16.1/reset-password?token={token}")
        return token
    
    def handle_reset_password(self, token: str, new_password: str):
        email = self.verify_reset_token(token)
        if not email:
            raise ValueError("Invalid or expired token")
        hashed = self.hash_password(new_password)
        return self.update_user_password(email, hashed)
    
    async def login_with_twitter(self, user_data: dict, db):
        user = await self.user_repository.get_or_create_user_by_twitter(user_data, db)
        return self.login(str(user.id))

    async def login_with_google(self, user_data: dict, db):
        user = await self.user_repository.get_or_create_user_by_google(user_data, db)
        token = jwt_create_token(subject=str(user.id))
        return {
            "access_token": token,
            "token_type": "bearer"
        }

    async def login_with_github(self, user_data: dict, db):
        user = await self.user_repository.get_or_create_user_by_github(user_data, db)
        token = jwt_create_token(subject=str(user.id))
        return {
            "access_token": token,
            "token_type": "bearer"
        }
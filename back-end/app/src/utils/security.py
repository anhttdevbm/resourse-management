"""Security file."""
import base64
from datetime import datetime, timedelta
from typing import Any, Dict

import bcrypt
from decouple import config
from jose import jwt
from pydantic import ValidationError

from app.src.exceptions.error_code import AuthErrorCode

SECRET_KEY = config("SECRET_KEY")
ALGORITHM = config("ALGORITHM", default="HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=30, cast=int)
REFRESH_TOKEN_EXPIRE_MINUTES = config("REFRESH_TOKEN_EXPIRE_MINUTES", default=60, cast=int)


def jwt_create_token(subject: str, public_key: str = "", expires_minutes: int = 0) -> str:
    """Create token when login with user."""
    expire = datetime.utcnow() + timedelta(
        minutes=expires_minutes if expires_minutes else int(ACCESS_TOKEN_EXPIRE_MINUTES))

    if public_key:
        to_encode = {"sub": subject, "exp": expire, "key": public_key}
    else:
        to_encode = {"sub": subject, "exp": expire}
    encoded_jwt: str = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def jwt_decode_token(access_token: str) -> Dict[str, Any]:
    """Decode jwt token."""
    try:
        payload: Dict[str, Any] = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise AuthErrorCode.EXPIRED_ACCESS_TOKEN.value
    except (jwt.JWTError, ValidationError):
        raise AuthErrorCode.INVALID_ACCESS_TOKEN.value
    return payload


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify 2 password when hash password."""
    try:
        # Kiểm tra nếu hashed_password là None hoặc rỗng
        if not hashed_password:
            return False
        
        # Đảm bảo hashed_password là string
        if isinstance(hashed_password, bytes):
            hashed_password = hashed_password.decode('utf-8')
        
        # Kiểm tra format bcrypt (phải bắt đầu bằng $2a$, $2b$, hoặc $2y$)
        if not hashed_password.startswith(('$2a$', '$2b$', '$2y$')):
            return False
        
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except (ValueError, TypeError, AttributeError) as e:
        # Log lỗi để debug
        print(f"Error verifying password: {e}")
        print(f"Hashed password type: {type(hashed_password)}")
        print(f"Hashed password value: {hashed_password[:50] if hashed_password else 'None'}...")
        return False


def get_password_hash(password: str) -> str:
    """Get password hash."""
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')


def password_encode(password: str) -> str:
    """Encode password with base64."""
    password = password + '!@#$%^&*()'
    password_encode_64 = base64.b64encode(password.encode('utf8')).decode('utf-8')
    return password_encode_64


def hash_password(password: str) -> str:
    """Hash password bằng bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')
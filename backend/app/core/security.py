import bcrypt
from datetime import datetime, timedelta, timezone
import re

from jose import jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def validate_password_strength(password: str) -> tuple[bool, str]:
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return False, "Parol yetarlicha uzun emas"
    if not re.search(r"[A-Z]", password):
        return False, "Parol yetarlicha murakkab emas"
    if not re.search(r"[a-z]", password):
        return False, "Parol yetarlicha murakkab emas"
    if not re.search(r"\d", password):
        return False, "Parol yetarlicha murakkab emas"
    return True, ""


def create_access_token(subject: str, expires_delta: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_delta or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode = {"sub": subject, "exp": expire, "type": "access"}
    return jwt.encode(to_encode, settings.access_token_key, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str, expires_delta: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=expires_delta or settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(to_encode, settings.refresh_token_key, algorithm=settings.ALGORITHM)


def create_reset_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
    )
    to_encode = {"sub": subject, "exp": expire, "type": "reset"}
    return jwt.encode(to_encode, settings.reset_token_key, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.access_token_key, algorithms=[settings.ALGORITHM])


def decode_refresh_token(token: str) -> dict:
    return jwt.decode(token, settings.refresh_token_key, algorithms=[settings.ALGORITHM])


def decode_reset_token(token: str) -> dict:
    return jwt.decode(token, settings.reset_token_key, algorithms=[settings.ALGORITHM])


def decode_token(token: str) -> dict:
    for key in [settings.access_token_key, settings.refresh_token_key, settings.reset_token_key]:
        try:
            return jwt.decode(token, key, algorithms=[settings.ALGORITHM])
        except Exception:
            continue
    raise jwt.JWTError("Token hech qanday kalit bilan mos kelmadi")

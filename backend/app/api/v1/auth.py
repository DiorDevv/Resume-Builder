from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_reset_token,
    decode_token,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.core.logging import logger
from app.models.user import User
from app.schemas.user import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.email import send_password_reset_email
from app.services.token import blacklist_token

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_KWARGS = {
    "httponly": True,
    "secure": settings.COOKIE_SECURE,
    "samesite": settings.SAME_SITE,
    "domain": settings.COOKIE_DOMAIN,
    "path": "/",
}


def _set_tokens(response: Response, access: str, refresh: str, remember_me: bool = False):
    access_max_age = 30 * 60 if remember_me else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    refresh_max_age = 30 * 24 * 3600 if remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400

    response.set_cookie(
        key="access_token",
        value=access,
        max_age=access_max_age,
        **COOKIE_KWARGS,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh,
        max_age=refresh_max_age,
        **COOKIE_KWARGS,
    )


def _clear_tokens(response: Response):
    response.delete_cookie("access_token", **COOKIE_KWARGS)
    response.delete_cookie("refresh_token", **COOKIE_KWARGS)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu email allaqachon ro'yxatdan o'tgan",
        )

    is_valid, error_msg = validate_password_strength(payload.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_msg,
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info(f"New user registered: {user.email}")
    return UserResponse.model_validate(user)


@router.post("/login")
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email yoki parol noto'g'ri",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akkaunt bloklangan",
        )

    access_expires = 30 if payload.remember_me else None
    refresh_expires = 30 if payload.remember_me else None

    access_token = create_access_token(str(user.id), expires_delta=access_expires)
    refresh_token = create_refresh_token(str(user.id), expires_delta=refresh_expires)

    logger.info(f"User logged in: {user.email}")

    response = Response(status_code=200)
    _set_tokens(response, access_token, refresh_token, payload.remember_me)
    return response


@router.post("/refresh")
async def refresh(request: Request):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token topilmadi",
        )

    from app.services.token import is_token_blacklisted
    if await is_token_blacklisted(refresh_token):
        response = Response(status_code=401)
        _clear_tokens(response)
        return response

    try:
        token_payload = decode_token(refresh_token)
        if token_payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Noto'g'ri token turi")
    except Exception:
        raise HTTPException(status_code=401, detail="Token yaroqsiz")

    user_id = token_payload.get("sub")
    response = Response(status_code=200)
    _set_tokens(
        response,
        create_access_token(user_id),
        create_refresh_token(user_id),
    )
    return response


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        expires_in = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
        await blacklist_token(refresh_token, expires_in)

    logger.info(f"User logged out: {current_user.email}")
    response = Response(status_code=204)
    _clear_tokens(response)
    return response


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user:
        return {"message": "Agar email mavjud bo'lsa, parolni tiklash linki yuboriladi"}

    reset_token = create_reset_token(str(user.id))
    try:
        await send_password_reset_email(user.email, user.full_name or user.email, reset_token)
        logger.info(f"Password reset email sent to: {user.email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {e}")

    return {"message": "Parolni tiklash linki emailingizga yuborildi"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    try:
        token_payload = decode_token(payload.token)
        if token_payload.get("type") != "reset":
            raise HTTPException(status_code=400, detail="Noto'g'ri token turi")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Token yaroqsiz")

    is_valid, error_msg = validate_password_strength(payload.new_password)
    if not is_valid:
        raise HTTPException(status_code=422, detail=error_msg)

    user_id = token_payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    user.hashed_password = hash_password(payload.new_password)
    await db.commit()
    logger.info(f"Password reset completed for user: {user.email}")
    return {"message": "Parol muvaffaqiyatli tiklandi"}


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri")

    is_valid, error_msg = validate_password_strength(payload.new_password)
    if not is_valid:
        raise HTTPException(status_code=422, detail=error_msg)

    current_user.hashed_password = hash_password(payload.new_password)
    await db.commit()
    logger.info(f"Password changed for user: {current_user.email}")
    return {"message": "Parol muvaffaqiyatli o'zgartirildi"}

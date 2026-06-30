from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings

SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}
CSRF_HEADER = "x-requested-with"
CSRF_HEADER_VALUE = "XMLHttpRequest"


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not settings.CSRF_PROTECTION_ENABLED:
            return await call_next(request)

        if request.method in SAFE_METHODS:
            return await call_next(request)

        has_auth_cookie = request.cookies.get("access_token") is not None

        if has_auth_cookie:
            header_value = request.headers.get(CSRF_HEADER)
            if header_value != CSRF_HEADER_VALUE:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "CSRF header (X-Requested-With) talab qilinadi"},
                )

        return await call_next(request)

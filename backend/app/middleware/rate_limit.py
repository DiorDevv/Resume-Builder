from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import logger

API_PREFIX = "/api/v1"

ENDPOINT_LIMITS: dict[str, tuple[int, int]] = {
    "auth": (10, 60),
    "forgot-password": (3, 300),
    "reset-password": (5, 300),
    "export": (10, 60),
    "ats": (20, 60),
    "default": (30, 60),
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._redis = None

    async def _get_redis(self):
        if self._redis is None:
            import redis.asyncio as aioredis
            self._redis = aioredis.from_url(
                settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2
            )
        return self._redis

    async def dispatch(self, request: Request, call_next):
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        path = request.url.path
        if not path.startswith(API_PREFIX):
            return await call_next(request)

        limits = self._resolve_limits(path)
        if limits is None:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        user_id = request.cookies.get("access_token", "")
        key_suffix = user_id[:16] if user_id else client_ip
        route_name = path.removeprefix(API_PREFIX).strip("/").replace("/", ":")
        rate_key = f"rl:{route_name}:{key_suffix}"

        max_requests, window = limits

        try:
            r = await self._get_redis()
            current = await r.get(rate_key)
            count = int(current) if current else 0

            if count >= max_requests:
                logger.warning(f"Rate limit exceeded for {key_suffix} on {path}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="So'rovlar soni cheklangan. Iltimos, biroz kuting.",
                )

            await r.setex(rate_key, window, count + 1)
        except HTTPException:
            raise
        except Exception:
            logger.warning(f"Rate limiter unavailable, allowing request on {path}")

        return await call_next(request)

    def _resolve_limits(self, path: str) -> tuple[int, int] | None:
        if "auth/forgot-password" in path:
            return ENDPOINT_LIMITS["forgot-password"]
        if "auth/reset-password" in path:
            return ENDPOINT_LIMITS["reset-password"]
        if "/auth/" in path:
            return ENDPOINT_LIMITS["auth"]
        if "/export/" in path:
            return ENDPOINT_LIMITS["export"]
        if "/ats/" in path:
            return ENDPOINT_LIMITS["ats"]
        return ENDPOINT_LIMITS["default"]

import redis.asyncio as aioredis

from app.core.config import settings

BLACKLIST_PREFIX = "token_blacklist:"

_redis: aioredis.Redis | None = None


async def _get_redis() -> aioredis.Redis | None:
    global _redis
    if _redis is None:
        try:
            _redis = aioredis.from_url(
                settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2
            )
        except Exception:
            return None
    return _redis


async def blacklist_token(token: str, expires_in: int) -> None:
    r = await _get_redis()
    if r is not None:
        try:
            await r.setex(f"{BLACKLIST_PREFIX}{token}", expires_in, "1")
        except Exception:
            pass


async def is_token_blacklisted(token: str) -> bool:
    try:
        r = await _get_redis()
        exists = await r.exists(f"{BLACKLIST_PREFIX}{token}")
        return exists == 1
    except Exception:
        return False

import redis.asyncio as aioredis

from app.core.config import settings

BLACKLIST_PREFIX = "token_blacklist:"

_redis: aioredis.Redis | None = None


async def _get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2
        )
    return _redis


async def blacklist_token(token: str, expires_in: int) -> None:
    r = await _get_redis()
    await r.setex(f"{BLACKLIST_PREFIX}{token}", expires_in, "1")


async def is_token_blacklisted(token: str) -> bool:
    r = await _get_redis()
    exists = await r.exists(f"{BLACKLIST_PREFIX}{token}")
    return exists == 1

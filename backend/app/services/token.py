import json

import redis.asyncio as aioredis

from app.core.config import settings

BLACKLIST_PREFIX = "token_blacklist:"


async def get_redis() -> aioredis.Redis:
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)


async def blacklist_token(token: str, expires_in: int) -> None:
    r = await get_redis()
    await r.setex(f"{BLACKLIST_PREFIX}{token}", expires_in, "1")
    await r.close()


async def is_token_blacklisted(token: str) -> bool:
    r = await get_redis()
    exists = await r.exists(f"{BLACKLIST_PREFIX}{token}")
    await r.close()
    return exists == 1

from redis.asyncio import Redis, ConnectionPool
from app.config import settings

_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool.from_url(
            settings.redis_url,
            max_connections=10,
            decode_responses=True,
        )
    return _pool


async def get_redis() -> Redis:
    """FastAPI dependency — yields an async Redis client from the shared pool."""
    return Redis(connection_pool=get_pool())

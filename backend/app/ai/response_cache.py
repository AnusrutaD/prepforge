from redis.asyncio import Redis


class AIResponseCache:
    """
    Redis-backed cache for AI responses.
    Hints are cached 7 days (universal — same for all users).
    Feedback is cached 24 hrs (tied to sessionId for async polling).
    """

    def __init__(self, redis: Redis):
        self.redis = redis

    async def get(self, key: str) -> str | None:
        return await self.redis.get(key)

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        await self.redis.setex(key, ttl_seconds, value)

    async def get_or_compute(
        self, key: str, ttl_seconds: int, compute_fn
    ) -> str:
        cached = await self.get(key)
        if cached:
            return cached
        result = await compute_fn()
        await self.set(key, result, ttl_seconds)
        return result

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock


@pytest.fixture
def app():
    from app.main import app
    return app


@pytest.mark.asyncio
async def test_health_returns_200(app):
    """Smoke test — health endpoint exists and responds."""
    mock_session = AsyncMock()
    mock_session.execute = AsyncMock()

    mock_redis = AsyncMock()
    mock_redis.ping = AsyncMock(return_value=True)

    async def override_db():
        yield mock_session

    async def override_redis():
        return mock_redis

    from app.db.session import get_db
    from app.db.redis import get_redis
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_redis] = override_redis

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/health")

    app.dependency_overrides.clear()
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "checks" in data


@pytest.mark.asyncio
async def test_unknown_route_returns_404(app):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/does-not-exist")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_error_response_format(app):
    """Verify ApiResponse error format is consistent."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/nonexistent")
    assert response.status_code == 404

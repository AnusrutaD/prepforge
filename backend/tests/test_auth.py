"""
Tests for POST /api/v1/auth/sync and GET, PATCH /api/v1/users/me

Strategy:
- Override get_current_user dependency to inject a fake user — no real JWT needed
- Override get_db to use a mock session — no real DB needed
- Test the business logic and response shapes, not infrastructure
"""
import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch


# ── Fixtures ──────────────────────────────────────────────────────────────────

def make_fake_user(
    onboarding_done: bool = False,
    diagnostic_done: bool = False,
    display_name: str | None = "Anusruta",
) -> MagicMock:
    """Build a fake User ORM object for dependency injection."""
    user = MagicMock()
    user.id = uuid.uuid4()
    user.clerk_id = "user_test_abc123"
    user.email = "test@example.com"
    user.display_name = display_name
    user.preferred_language = None
    user.target_date = None
    user.email_reminder = False
    user.reminder_time = None
    user.onboarding_done = onboarding_done
    user.diagnostic_done = diagnostic_done
    return user


@pytest.fixture
def app():
    from app.main import app
    return app


@pytest.fixture
def fake_user():
    return make_fake_user()


@pytest.fixture
def mock_db():
    """Async DB session mock that handles commit/refresh."""
    db = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    return db


def override_deps(app, fake_user, mock_db):
    """Wire dependency overrides into the app. Returns teardown callable."""
    from app.api.deps import get_current_user, get_db

    async def _get_user():
        return fake_user

    async def _get_db():
        yield mock_db

    app.dependency_overrides[get_current_user] = _get_user
    app.dependency_overrides[get_db] = _get_db

    def teardown():
        app.dependency_overrides.clear()

    return teardown


# ── POST /auth/sync ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_auth_sync_new_user(app, fake_user, mock_db):
    """New user (onboarding_done=False) → is_new_user=True in response."""
    teardown = override_deps(app, fake_user, mock_db)
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/auth/sync",
                json={
                    "clerk_id": fake_user.clerk_id,
                    "email": fake_user.email,
                    "display_name": "Anusruta",
                },
                headers={"Authorization": "Bearer fake_token"},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"]["is_new_user"] is True
        assert body["data"]["onboarding_done"] is False
        assert "user_id" in body["data"]
    finally:
        teardown()


@pytest.mark.asyncio
async def test_auth_sync_returning_user(app, mock_db):
    """Returning user (onboarding_done=True) → is_new_user=False."""
    returning_user = make_fake_user(onboarding_done=True)
    teardown = override_deps(app, returning_user, mock_db)
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/auth/sync",
                json={"clerk_id": returning_user.clerk_id, "email": returning_user.email},
                headers={"Authorization": "Bearer fake_token"},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["data"]["is_new_user"] is False
        assert body["data"]["onboarding_done"] is True
    finally:
        teardown()


@pytest.mark.asyncio
async def test_auth_sync_requires_auth(app):
    """No Authorization header → 403 (HTTPBearer rejects missing credentials)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/sync",
            json={"clerk_id": "abc", "email": "x@x.com"},
        )
    assert response.status_code == 403


# ── GET /users/me ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_me_returns_user_profile(app, fake_user, mock_db):
    """GET /users/me returns the current user's profile."""
    teardown = override_deps(app, fake_user, mock_db)
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/v1/users/me",
                headers={"Authorization": "Bearer fake_token"},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"]["email"] == fake_user.email
        assert body["data"]["onboarding_done"] is False
    finally:
        teardown()


# ── PATCH /users/me ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_patch_me_updates_onboarding(app, fake_user, mock_db):
    """PATCH /users/me with onboarding data returns updated user."""
    # Simulate the DB returning an updated user after commit
    updated_user = make_fake_user(onboarding_done=True)
    updated_user.preferred_language = "python"
    mock_db.refresh = AsyncMock(side_effect=lambda u: None)

    teardown = override_deps(app, fake_user, mock_db)
    try:
        with patch(
            "app.services.user_service.UserService.update_onboarding",
            new_callable=AsyncMock,
            return_value=updated_user,
        ):
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
                response = await client.patch(
                    "/api/v1/users/me",
                    json={
                        "preferred_language": "python",
                        "onboarding_done": True,
                    },
                    headers={"Authorization": "Bearer fake_token"},
                )
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"]["onboarding_done"] is True
        assert body["data"]["preferred_language"] == "python"
    finally:
        teardown()

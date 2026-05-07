import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.db.session import get_db

bearer_scheme = HTTPBearer()
_jwks_cache: dict = {}  # In-process cache, refreshed on restart


async def _get_clerk_jwks() -> dict:
    """Fetch Clerk public JWKS for RS256 token verification."""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    async with httpx.AsyncClient() as client:
        resp = await client.get(settings.clerk_jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    FastAPI dependency injected into every protected route.
    Validates Clerk JWT → gets or creates user in PrepForge DB.

    Usage: current_user = Depends(get_current_user)
    """
    token = credentials.credentials
    try:
        jwks = await _get_clerk_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        clerk_id: str = payload.get("sub")
        email: str = payload.get("email", "")
        if not clerk_id:
            raise HTTPException(status_code=401, detail="Invalid token subject")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    # Import here to avoid circular imports
    from app.services.user_service import UserService
    user, _ = await UserService(db).get_or_create_by_clerk_id(clerk_id, email)
    return user

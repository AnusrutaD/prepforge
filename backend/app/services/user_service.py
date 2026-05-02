"""
UserService — all database operations for the User model.
Keep all SQL logic here, never in route handlers.
Route handlers call service methods, service methods talk to the DB.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import OnboardingUpdateRequest


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_clerk_id(self, clerk_id: str) -> User | None:
        """Return the user with this Clerk ID, or None if not found."""
        result = await self._db.execute(
            select(User).where(User.clerk_id == clerk_id)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id) -> User | None:
        """Return user by internal UUID, or None."""
        result = await self._db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_or_create_by_clerk_id(
        self,
        clerk_id: str,
        email: str,
        display_name: str | None = None,
    ) -> tuple[User, bool]:
        """
        Core auth method — called on every protected request via deps.get_current_user.

        Returns (user, is_new_user).
        - is_new_user=True  → first login, frontend should redirect to /onboarding
        - is_new_user=False → returning user
        """
        user = await self.get_by_clerk_id(clerk_id)
        if user:
            return user, False

        # First time we've seen this Clerk ID — create a new user row
        user = User(
            clerk_id=clerk_id,
            email=email,
            display_name=display_name,
        )
        self._db.add(user)
        await self._db.commit()
        await self._db.refresh(user)
        return user, True

    async def update_onboarding(
        self,
        user: User,
        payload: OnboardingUpdateRequest,
    ) -> User:
        """
        Apply onboarding form data to the user row.
        Only updates fields that are explicitly set (not None) in the payload.
        This allows partial updates — safe to call multiple times.
        """
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        await self._db.commit()
        await self._db.refresh(user)
        return user

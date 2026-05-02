"""
GET  /api/v1/users/me        → return current user's full profile
PATCH /api/v1/users/me       → update onboarding fields (called from /onboarding page)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.user import OnboardingUpdateRequest, UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=ApiResponse[UserResponse])
async def get_me(
    current_user: User = Depends(get_current_user),
) -> ApiResponse[UserResponse]:
    """
    Return the authenticated user's full profile.
    Used by the frontend to hydrate user state on app load.
    """
    return ApiResponse.ok(UserResponse.model_validate(current_user))


@router.patch("/me", response_model=ApiResponse[UserResponse])
async def update_me(
    body: OnboardingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[UserResponse]:
    """
    Partial update of the current user's profile.
    Called from the /onboarding page when the user submits the form.

    Only fields explicitly included in the request body are updated —
    omitted fields are left unchanged (model_dump(exclude_unset=True)).
    """
    svc = UserService(db)
    updated_user = await svc.update_onboarding(current_user, body)
    return ApiResponse.ok(UserResponse.model_validate(updated_user))

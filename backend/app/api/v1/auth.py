"""
POST /api/v1/auth/sync

Called by the frontend immediately after every Clerk login.
Verifies the JWT (via the Depends chain), gets-or-creates the user in our DB,
returns enough info for the frontend to decide where to redirect the user.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.user import AuthSyncRequest, AuthSyncResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sync", response_model=ApiResponse[AuthSyncResponse])
async def auth_sync(
    body: AuthSyncRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[AuthSyncResponse]:
    """
    Sync Clerk identity into PrepForge DB.

    Flow:
      1. FastAPI validates the Bearer JWT via get_current_user dependency
      2. get_current_user already calls get_or_create_by_clerk_id internally
      3. We call it again here with the full body payload (display_name etc.)
         to ensure display_name is persisted if provided

    The frontend must call this on every login — it is idempotent.
    """
    svc = UserService(db)

    # Update display_name if provided and not yet set
    if body.display_name and not current_user.display_name:
        current_user.display_name = body.display_name
        await db.commit()
        await db.refresh(current_user)

    return ApiResponse.ok(
        AuthSyncResponse(
            user_id=current_user.id,
            onboarding_done=current_user.onboarding_done,
            diagnostic_done=current_user.diagnostic_done,
            is_new_user=not current_user.onboarding_done,
        )
    )

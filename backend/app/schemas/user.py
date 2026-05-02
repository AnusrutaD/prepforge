"""
Pydantic schemas for user-related API requests and responses.
These are the shapes of data going in and out of the API —
separate from the SQLAlchemy ORM model (app/models/user.py).
"""
import uuid
from datetime import date, time
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ── Request bodies ────────────────────────────────────────────────────────────

class AuthSyncRequest(BaseModel):
    """
    Body for POST /auth/sync.
    Frontend sends this right after Clerk issues a JWT.
    clerk_id and email come from the Clerk session object on the frontend.
    """
    clerk_id: str = Field(..., description="Clerk user ID — matches 'sub' claim in JWT")
    email: EmailStr = Field(..., description="User's verified email from Clerk")
    display_name: Optional[str] = Field(None, description="Display name from Clerk profile")


class OnboardingUpdateRequest(BaseModel):
    """
    Body for PATCH /users/me — submitted from the /onboarding page.
    All fields optional so partial updates are allowed.
    """
    preferred_language: Optional[str] = Field(
        None,
        description="Coding language preference: python | java | cpp | javascript",
    )
    target_date: Optional[date] = Field(
        None,
        description="User's target interview date",
    )
    email_reminder: Optional[bool] = Field(None)
    reminder_time: Optional[time] = Field(None)
    onboarding_done: Optional[bool] = Field(None)


# ── Response bodies ───────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """
    Returned from POST /auth/sync and GET /users/me.
    Frontend uses onboarding_done to decide where to redirect after login.
    """
    model_config = {"from_attributes": True}  # enables .model_validate(orm_obj)

    id: uuid.UUID
    clerk_id: str
    email: str
    display_name: Optional[str]
    preferred_language: Optional[str]
    target_date: Optional[date]
    email_reminder: bool
    reminder_time: Optional[time]
    onboarding_done: bool
    diagnostic_done: bool


class AuthSyncResponse(BaseModel):
    """Slim response from POST /auth/sync — just what the frontend needs to route."""
    user_id: uuid.UUID
    onboarding_done: bool
    diagnostic_done: bool
    is_new_user: bool

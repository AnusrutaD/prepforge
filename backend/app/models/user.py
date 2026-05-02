import uuid
from datetime import time
from sqlalchemy import Boolean, Date, String, Time, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class User(Base):
    """
    Core user record. Created on first Clerk login via POST /auth/sync.
    clerk_id is the Clerk user ID (sub claim from JWT) — the primary
    external identifier we get from every authenticated request.
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    clerk_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="Clerk user ID — 'sub' claim from Clerk JWT",
    )
    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        nullable=False,
        index=True,
    )
    display_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # Onboarding preferences — filled in on /onboarding page
    preferred_language: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="e.g. python, java, cpp, javascript",
    )
    target_date: Mapped[str | None] = mapped_column(
        Date(),
        nullable=True,
        comment="User's target interview date",
    )
    email_reminder: Mapped[bool] = mapped_column(
        Boolean(),
        nullable=False,
        default=False,
        server_default="false",
    )
    reminder_time: Mapped[time | None] = mapped_column(
        Time(),
        nullable=True,
        comment="Daily reminder time in user's local timezone",
    )

    # Progress flags
    onboarding_done: Mapped[bool] = mapped_column(
        Boolean(),
        nullable=False,
        default=False,
        server_default="false",
        comment="True after user completes the onboarding form",
    )
    diagnostic_done: Mapped[bool] = mapped_column(
        Boolean(),
        nullable=False,
        default=False,
        server_default="false",
        comment="True after user completes the initial diagnostic quiz",
    )

    # Timestamps
    created_at: Mapped[str] = mapped_column(
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[str] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} onboarding={self.onboarding_done}>"

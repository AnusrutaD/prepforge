"""create users table

Revision ID: 0001
Revises:
Create Date: 2026-05-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic
revision: str = "0001"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("clerk_id", sa.String(255), nullable=False, comment="Clerk user ID — sub claim from JWT"),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("display_name", sa.String(255), nullable=True),

        # Onboarding preferences
        sa.Column("preferred_language", sa.String(50), nullable=True, comment="e.g. python, java, cpp, javascript"),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("email_reminder", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("reminder_time", sa.Time(), nullable=True),

        # Progress flags
        sa.Column("onboarding_done", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("diagnostic_done", sa.Boolean(), nullable=False, server_default="false"),

        # Timestamps
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # Unique constraints
    op.create_unique_constraint("uq_users_clerk_id", "users", ["clerk_id"])
    op.create_unique_constraint("uq_users_email", "users", ["email"])

    # Indexes for fast lookup on every authenticated request
    op.create_index("ix_users_clerk_id", "users", ["clerk_id"])
    op.create_index("ix_users_email", "users", ["email"])


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_clerk_id", table_name="users")
    op.drop_constraint("uq_users_email", "users")
    op.drop_constraint("uq_users_clerk_id", "users")
    op.drop_table("users")

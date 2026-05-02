# Import all models here so Alembic's autogenerate can detect them.
# Any model NOT imported here will be invisible to migrations.
from app.models.base import Base  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = ["Base", "User"]

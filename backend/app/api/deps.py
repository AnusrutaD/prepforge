"""
Shared FastAPI dependencies.
Import these into route files — do not duplicate dependency logic.
"""
from app.db.session import get_db      # noqa: F401
from app.db.redis import get_redis     # noqa: F401
from app.middleware.auth import get_current_user  # noqa: F401

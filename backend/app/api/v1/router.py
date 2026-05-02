from fastapi import APIRouter
from app.api.v1 import health
from app.api.v1 import auth
from app.api.v1 import users

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])

# Sprint 1
api_router.include_router(auth.router)
api_router.include_router(users.router)

# Routers added sprint by sprint:
# Sprint 2: diagnostic
# Sprint 3: recommendations, problems, sessions, execute
# Sprint 4: hints, feedback, progress, dashboard

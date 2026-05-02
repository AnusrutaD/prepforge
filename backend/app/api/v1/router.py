from fastapi import APIRouter
from app.api.v1 import health

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])

# Routers added sprint by sprint:
# Sprint 1: auth, users
# Sprint 2: diagnostic
# Sprint 3: recommendations, problems, sessions, execute
# Sprint 4: hints, feedback, progress, dashboard

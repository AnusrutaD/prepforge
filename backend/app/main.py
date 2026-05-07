from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.middleware.error_handler import register_exception_handlers
from app.config import settings

app = FastAPI(
    title="PrepForge API",
    version="1.0.0",
    description="Adaptive DSA interview preparation platform",
    docs_url="/api-docs" if settings.env == "development" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # hardcoded for dev safety
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

register_exception_handlers(app)
app.include_router(api_router, prefix="/api/v1")

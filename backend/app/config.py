from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Application
    env: Literal["development", "production"] = "development"
    cors_origins: list[str] = ["http://localhost:3000"]

    # Database
    db_url: str = "postgresql+asyncpg://prepforge:prepforge@localhost:5432/prepforge"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Auth
    clerk_jwks_url: str = "https://placeholder.clerk.accounts.dev/.well-known/jwks.json"

    # AI Provider — switch between "ollama" and "claude" via env var, zero code change
    ai_provider: Literal["ollama", "claude"] = "ollama"

    # Ollama (local dev + beta)
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"

    # Claude (production launch — only needed when ai_provider=claude)
    claude_api_key: str = "placeholder"

    # Code Execution
    judge0_url: str = "https://judge0-ce.p.rapidapi.com"
    judge0_api_key: str = "placeholder"


settings = Settings()

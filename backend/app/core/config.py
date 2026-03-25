"""
Backend configuration using Pydantic v2 BaseSettings.
Reads environment variables from .env file automatically.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    PROJECT_NAME: str = "AI Interviewer API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Supabase
    SUPABASE_URL: str = "http://localhost:54321"
    SUPABASE_KEY: str = "your-anon-key-here"
    SUPABASE_SERVICE_ROLE_KEY: str = "your-service-role-key-here"
    SUPABASE_JWT_SECRET: str = "your-jwt-secret-here"

    # OpenAI
    OPENAI_API_KEY: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Matching
    MATCH_THRESHOLD: float = 75.0

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — call get_settings() everywhere."""
    return Settings()


# Module-level convenience reference
settings = get_settings()

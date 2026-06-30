from pydantic_settings import BaseSettings
from typing import List
import secrets


class Settings(BaseSettings):
    PROJECT_NAME: str = "Resume Builder"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/resume_builder"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_SECRET_KEY: str | None = None
    REFRESH_TOKEN_SECRET_KEY: str | None = None
    RESET_TOKEN_SECRET_KEY: str | None = None
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]

    RESET_TOKEN_EXPIRE_MINUTES: int = 15
    PDF_STORAGE_PATH: str = "./storage/pdf"

    PASSWORD_MIN_LENGTH: int = 8
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 10
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    LOG_LEVEL: str = "INFO"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@resumebuilder.uz"
    SMTP_FROM_NAME: str = "Resume Builder"

    FRONTEND_URL: str = "http://localhost:3000"
    COOKIE_DOMAIN: str = "localhost"
    COOKIE_SECURE: bool = False
    SAME_SITE: str = "lax"
    CSRF_PROTECTION_ENABLED: bool = True

    SESSION_TIMEOUT_MINUTES: int = 30

    @property
    def cors_origins(self) -> List[str]:
        return self.BACKEND_CORS_ORIGINS

    @property
    def access_token_key(self) -> str:
        return self.ACCESS_TOKEN_SECRET_KEY or self.SECRET_KEY

    @property
    def refresh_token_key(self) -> str:
        return self.REFRESH_TOKEN_SECRET_KEY or self.SECRET_KEY

    @property
    def reset_token_key(self) -> str:
        return self.RESET_TOKEN_SECRET_KEY or self.SECRET_KEY

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

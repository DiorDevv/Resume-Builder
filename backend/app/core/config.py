from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Resume Builder"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/resume_builder"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    RESET_TOKEN_EXPIRE_MINUTES: int = 15
    PDF_STORAGE_PATH: str = "./storage/pdf"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

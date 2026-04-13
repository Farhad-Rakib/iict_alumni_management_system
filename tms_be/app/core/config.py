"""Application configuration settings."""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/alumni_db"
    SQLALCHEMY_ECHO: bool = False

    # JWT
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OTP
    OTP_EXPIRE_MINUTES: int = 10
    OTP_LENGTH: int = 6
    VERIFICATION_LINK_EXPIRE_HOURS: int = 72
    MAX_OTP_ATTEMPTS: int = 5

    # Email
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SENDER_EMAIL: str = "noreply@alumni.com"
    FRONTEND_VERIFY_URL: str = "http://localhost:5173/verify"
    FRONTEND_RESET_URL: str = "http://localhost:5173/reset-password"

    # Application
    APP_NAME: str = "Alumni Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ]

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 5242880  # 5MB

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

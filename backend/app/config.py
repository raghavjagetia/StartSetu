import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "StartSetu API"
    database_url: str = "sqlite:///./startsetu.db"
    secret_key: str = "dev-secret-key-change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 3  # 3 days
    allowed_origins: str = "http://localhost:5173"
    upload_dir: str = "uploads"
    admin_email: str = "admin@startsetu.gov.in"
    admin_password: str = "ChangeMe123!"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings(
    database_url=os.getenv("DATABASE_URL", "sqlite:///./startsetu.db"),
    secret_key=os.getenv("SECRET_KEY", "dev-secret-key-change-me-in-production"),
    allowed_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173"),
    admin_email=os.getenv("ADMIN_EMAIL", "admin@startsetu.gov.in"),
    admin_password=os.getenv("ADMIN_PASSWORD", "ChangeMe123!"),
)

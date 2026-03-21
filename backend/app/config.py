from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "visicare-super-secret-key-change-in-production"
    DATABASE_URL: str = "sqlite+aiosqlite:///./visicare.db"
    DAILY_API_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()

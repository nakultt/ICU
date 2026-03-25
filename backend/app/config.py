from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "visicare-super-secret-key-change-in-production"
    MONGODB_URL: str = "mongodb+srv://sridbuser:dbusersri@srisivaranjani.oe9bhtr.mongodb.net/"
    DAILY_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 24 hours
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()

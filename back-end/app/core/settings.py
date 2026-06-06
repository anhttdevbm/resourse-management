from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SMTP_HOST: str
    SMTP_PORT: int
    EMAIL_USER: str
    EMAIL_PASSWORD: str
    FRONTEND_RESET_URL: str

    class Config:
        env_file = ".env",
        extra="ignore"  #

settings = Settings()

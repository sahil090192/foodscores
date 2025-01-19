from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    EDAMAM_APP_ID: str
    EDAMAM_APP_KEY: str
    
    class Config:
        env_file = ".env"

settings = Settings()

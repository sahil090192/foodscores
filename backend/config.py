from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    EDAMAM_APP_ID: str
    EDAMAM_APP_KEY: str
    OPENAI_API_KEY: str
    
    class Config:
        env_file = ".env"

settings = Settings()

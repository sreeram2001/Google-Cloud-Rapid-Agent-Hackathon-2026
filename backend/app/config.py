import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    GOOGLE_CLOUD_LOCATION: str = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "hireintos")
    GEMINI_MODEL: str = "gemini-2.0-flash"


settings = Settings()

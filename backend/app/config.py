import os
from dotenv import load_dotenv

load_dotenv()

# ADK reads GOOGLE_API_KEY directly from environment
# Ensure it's set if loaded from .env
if os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")


class Settings:
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    GOOGLE_CLOUD_LOCATION: str = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "hireintos")
    GEMINI_MODEL: str = "gemini-2.5-flash"


settings = Settings()

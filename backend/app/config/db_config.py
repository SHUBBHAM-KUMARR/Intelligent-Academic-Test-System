import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory or fallback to current working directory
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class DatabaseConfig:
    """Database configuration options."""

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "SQLALCHEMY_DATABASE_URI",
        "sqlite:///iats.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "False").lower() in ("true", "1", "t")
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", 300)),
    }

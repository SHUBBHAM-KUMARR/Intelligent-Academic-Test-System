import os
from dotenv import load_dotenv
from app.config.db_config import DatabaseConfig

load_dotenv()

class Config(DatabaseConfig):
    """Base configuration class."""
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")
    CORS_ORIGINS = list({
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        *[
            origin.strip().rstrip("/")
            for origin in os.getenv(
                "CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173",
            ).split(",")
            if origin.strip()
        ]
    })

class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True

class ProductionConfig(Config):
    """Production environment configuration."""
    DEBUG = False

class TestingConfig(Config):
    """Testing environment configuration using in-memory SQLite."""
    TESTING = True
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {}
    SECRET_KEY = "test-secret-key-at-least-32-chars-long"

config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}

__all__ = [
    "DatabaseConfig",
    "Config",
    "DevelopmentConfig",
    "ProductionConfig",
    "TestingConfig",
    "config_by_name",
]


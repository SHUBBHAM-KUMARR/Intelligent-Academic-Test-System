import os
from dotenv import load_dotenv
from app.config.db_config import DatabaseConfig

load_dotenv()

class Config(DatabaseConfig):
    """Base configuration class."""
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")

class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True

class ProductionConfig(Config):
    """Production environment configuration."""
    DEBUG = False

config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}

__all__ = [
    "DatabaseConfig",
    "Config",
    "DevelopmentConfig",
    "ProductionConfig",
    "config_by_name",
]


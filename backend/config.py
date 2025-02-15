from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os
from functools import lru_cache
import logging
import sys

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def determine_environment():
    """
    Determine the current environment with multiple detection strategies
    """
    # Check explicit ENV variable first
    env = os.getenv("ENV")
    if env:
        return env

    # Check for development indicators
    if any('uvicorn' in arg and '--reload' in sys.argv for arg in sys.argv):
        return "development"
    
    if any(indicator in str(sys.argv) for indicator in ['pytest', 'debug']):
        return "development"

    # Default to production for safety
    return "production"

class Settings(BaseSettings):
    # Environment configuration
    ENV: str = determine_environment()
    
    # Database configuration with default values for development
    DB_USER: str = Field(
        default="postgres", 
        description="Database username. Defaults to 'postgres' in development."
    )
    DB_PASSWORD: str = Field(
        default="", 
        description="Database password. Defaults to empty string in development."
    )
    DB_HOST: str = Field(
        default="localhost", 
        description="Database host. Defaults to 'localhost' in development."
    )
    DB_PORT: str = Field(
        default="5432", 
        description="Database port. Defaults to standard PostgreSQL port."
    )
    DB_NAME: str = Field(
        default="productdb", 
        description="Database name. Defaults to 'productdb' in development."
    )
    
    # Database pool configuration
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30

    # Configuration model to handle environment variables
    model_config = SettingsConfigDict(
        env_file=(".env.development", ".env"),  # Look for development-specific env first
        env_file_encoding='utf-8',
        extra='ignore',  # Ignore extra environment variables
        case_sensitive=True
    )

    def __init__(self, **kwargs):
        # Use super().__init__ with any provided kwargs
        super().__init__(**kwargs)
        
        # Log environment and database configuration for debugging
        logger.info(f"🚀 Application Environment: {self.ENV}")
        self.log_database_config()

    def log_database_config(self):
        """
        Log database configuration details securely
        """
        # Mask password in logs for security
        masked_password = '*' * len(self.DB_PASSWORD) if self.DB_PASSWORD else ''
        
        logger.info(f"📦 Database Configuration:")
        logger.info(f"   Host: {self.DB_HOST}")
        logger.info(f"   Port: {self.DB_PORT}")
        logger.info(f"   User: {self.DB_USER}")
        logger.info(f"   Database: {self.DB_NAME}")
        logger.info(f"   Password: {'****' if masked_password else 'Not Set'}")

    @property
    def database_url(self) -> str:
        """
        Construct a PostgreSQL connection URL
        """
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

@lru_cache()
def get_settings():
    """
    Cached settings retrieval with error handling
    """
    try:
        return Settings()
    except Exception as e:
        logger.error(f"❌ Failed to load settings: {e}")
        raise

# Recommended: Create a .env.development file
# .env.development contents:
# DB_USER=your_dev_username
# DB_PASSWORD=your_dev_password
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=productdb
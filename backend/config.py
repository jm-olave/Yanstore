from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache
import os
import logging
import sys

# Logging configuration
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def determine_environment():
    """
    Intelligently determine the current application environment
    """
    # Explicit environment variable takes highest priority
    env = os.getenv("ENV")
    if env:
        return env

    # Check for development indicators
    if any('uvicorn' in arg and '--reload' in sys.argv for arg in sys.argv):
        return "development"
    
    if any(indicator in str(sys.argv) for indicator in ['pytest', 'debug']):
        return "development"

    # Railway typically sets a specific environment
    if os.getenv("RAILWAY_ENVIRONMENT"):
        return "production"
    if os.getenv("RAILWAY_ENVIRONMENT_NAME"):
        logger.info("sabe que esta en produccion")
        return "production"

    # Default to development for local safety
    return "development"

class Settings(BaseSettings):
    # Environment Detection
    ENV: str = determine_environment()
    
    # Database Configuration with Flexible Defaults
    DB_USER: str = Field(
        default="postgres", 
        description="Database username"
    )
    DB_PASSWORD: str = Field(
        default="", 
        description="Database password"
    )
    DB_HOST: str = Field(
        default="localhost", 
        description="Database host"
    )
    DB_PORT: str = Field(
        default="5432", 
        description="Database port"
    )
    DB_NAME: str = Field(
        default="productdb", 
        description="Database name"
    )

    # Database Pool Configuration
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30

    # Pydantic Settings Configuration
    model_config = SettingsConfigDict(
        env_file=(".env.development", ".env"),
        env_file_encoding='utf-8',
        extra='ignore',
        case_sensitive=True
    )

    def __init__(self, **kwargs):
        """
        Custom initialization with environment-specific configuration
        """
        # Prioritize environment variables
        env_mapping = {
            'DB_USER': ['PGUSER', 'DB_USER'],
            'DB_PASSWORD': ['PGPASSWORD', 'DB_PASSWORD'],
            'DB_HOST': ['PGHOST', 'DB_HOST'],
            'DB_PORT': ['PGPORT', 'DB_PORT'],
            'DB_NAME': ['PGDATABASE', 'DB_NAME']
        }

        # Update environment variables with priority
        for attr, env_keys in env_mapping.items():
            for env_key in env_keys:
                env_value = os.getenv(env_key)
                if env_value:
                    os.environ[attr] = env_value
                    break

        # Initialize with updated environment
        super().__init__(**kwargs)
        
        # Log environment context
        logger.info(f"🚀 Application Environment: {self.ENV}")
        
        # Log database configuration (securely)
        self.log_database_config()

    def log_database_config(self):
        """
        Securely log database configuration
        """
        # Mask sensitive information
        masked_password = '*' * len(self.DB_PASSWORD) if self.DB_PASSWORD else 'Not Set'
        
        logger.info("📦 Database Configuration:")
        logger.info(f"   Environment: {self.ENV}")
        logger.info(f"   Host: {self.DB_HOST}")
        logger.info(f"   Port: {self.DB_PORT}")
        logger.info(f"   User: {self.DB_USER}")
        logger.info(f"   Database: {self.DB_NAME}")
        logger.info(f"   Password: {'****' if masked_password else 'Not Set'}")

    @property
    def database_url(self) -> str:
        """
        Construct a secure database connection URL
        """
        # Handle empty password case
        password_part = f":{self.DB_PASSWORD}" if self.DB_PASSWORD else ""
        return (
            f"postgresql://{self.DB_USER}"
            f"{password_part}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

@lru_cache()
def get_settings():
    """
    Cached settings retrieval with comprehensive error handling
    """
    try:
        settings = Settings()
        return settings
    except Exception as e:
        logger.error(f"❌ Failed to load settings: {e}")
        raise
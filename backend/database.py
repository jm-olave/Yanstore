from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import logging
from config import get_settings

# Set up logging to help us understand database operations
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Get settings from config
settings = get_settings()

# Construct the database URL using settings
DATABASE_URL = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"

# Create the SQLAlchemy engine with important configuration options
engine = create_engine(
    DATABASE_URL,
    # Echo SQL statements for debugging (only in development)
    echo=settings.ENV == "development",
    
    # Connection pool settings from config
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    
    # Enable automatic reconnection if connection is lost
    pool_pre_ping=True,
    
    # Connection arguments for better performance and security
    connect_args={
        "application_name": f"YanStore Backend ({settings.ENV})",
        "client_encoding": "utf8",
        "connect_timeout": 10
    }
)

# Create session factory
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

# Create base class for declarative models
Base = declarative_base()

def init_db():
    """
    Drops all tables and recreates them from scratch.
    Only allowed in development environment for safety.
    """

    try:
        Base.metadata.drop_all(bind=engine)
        logger.info("Dropped all existing tables")
        
        Base.metadata.create_all(bind=engine)
        logger.info("Created new tables successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise

def get_db():
    """
    Dependency function that creates a new database session for each request.
    Used by FastAPI's dependency injection system.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_db_connection():
    """
    Verify that we can connect to the database.
    Useful for health checks and initial setup verification.
    """
    try:
        with engine.connect() as connection:
            connection.execute("SELECT 1")
            logger.info(f"Database connection verified successfully in {settings.ENV} environment")
            return True
    except Exception as e:
        logger.error(f"Database connection verification failed: {str(e)}")
        return False

def get_db_config():
    """
    Get the current database configuration.
    Useful for debugging and verification.
    """
    return {
        "environment": settings.ENV,
        "host": settings.DB_HOST,
        "port": settings.DB_PORT,
        "database": settings.DB_NAME,
        "user": settings.DB_USER,
        "connected": verify_db_connection()
    }
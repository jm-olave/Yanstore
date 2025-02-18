from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import logging
from dataclasses import dataclass
import time
from sqlalchemy.exc import OperationalError

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(".env.development")

@dataclass
class DatabaseSettings:
    ENV: str = os.getenv('ENV')
    DB_USER: str = os.getenv('DB_USER')
    DB_PASSWORD: str = os.getenv('DB_PASSWORD')
    DB_HOST: str = os.getenv('DB_HOST')
    DB_PORT: str = os.getenv('DB_PORT', '5432')
    DB_NAME: str = os.getenv('DB_NAME')

# Create settings instance
settings = DatabaseSettings()

# Construct database URL
DATABASE_URL = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"

def create_db_engine():
    return create_engine(
        DATABASE_URL,
        echo=settings.ENV == "development",
        pool_pre_ping=True,  # Enables automatic reconnection
        pool_recycle=300,    # Recycle connections every 5 minutes
        pool_size=5,         # Maintain a pool of 5 connections
        max_overflow=10,     # Allow up to 10 additional connections
        connect_args={
            "application_name": f"YanStore Backend ({settings.ENV})",
            "client_encoding": "utf8",
            "connect_timeout": 10,
            "keepalives": 1,              # Enable keepalive
            "keepalives_idle": 30,        # Seconds between keepalive probes
            "keepalives_interval": 10,    # Seconds between probes
            "keepalives_count": 5         # Number of probes before connection is considered dead
        }
    )

# Create engine with connection pooling and automatic reconnection
engine = create_db_engine()

# Create session factory with retry logic
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

def get_db():
    """
    Dependency function that creates a new database session for each request
    with retry logic for handling connection issues.
    """
    db = SessionLocal()
    max_retries = 3
    retry_delay = 1  # seconds

    for attempt in range(max_retries):
        try:
            yield db
            break
        except OperationalError as e:
            if attempt == max_retries - 1:
                logger.error(f"Failed to connect to database after {max_retries} attempts")
                raise
            logger.warning(f"Database connection attempt {attempt + 1} failed, retrying...")
            time.sleep(retry_delay)
        finally:
            db.close()

def verify_db_connection():
    """Verify database connection with retry logic"""
    max_retries = 3
    retry_delay = 1

    for attempt in range(max_retries):
        try:
            with engine.connect() as connection:
                connection.execute("SELECT 1")
                logger.info(f"Database connection verified successfully in {settings.ENV} environment")
                return True
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"Database connection verification failed: {str(e)}")
                return False
            logger.warning(f"Connection attempt {attempt + 1} failed, retrying...")
            time.sleep(retry_delay)
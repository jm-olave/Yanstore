from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import logging
from dataclasses import dataclass

# Set up logging to help us understand database operations
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
# Load environment variables based on environment
if os.getenv('ENV') == 'production':
    load_dotenv('.env.production')
else:
    load_dotenv('.env.development')

# Create settings dictionary directly from environment variables
@dataclass
class DatabaseSettings:
    ENV: str = os.getenv('ENV', 'development')
    DB_USER: str = os.getenv('DB_USER', 'postgres')
    DB_PASSWORD: str = os.getenv('DB_PASSWORD', '')
    DB_HOST: str = os.getenv('DB_HOST', 'localhost')
    DB_PORT: str = os.getenv('DB_PORT', '5432')
    DB_NAME: str = os.getenv('DB_NAME', 'yanstore')

    def validate(self):
        """Validate that all required settings are present"""
        missing = []
        for field in ['DB_USER', 'DB_HOST', 'DB_NAME']:
            if not getattr(self, field):
                missing.append(field)
        if missing:
            raise ValueError(f"Missing required database settings: {', '.join(missing)}")

# Create settings instance and validate
settings = DatabaseSettings()
try:
    settings.validate()
except ValueError as e:
    logger.error(f"Database configuration error: {str(e)}")
    raise

# Log the configuration (without sensitive data)
logger.info(f"Database Configuration - Host: {settings.DB_HOST}, "
            f"Port: {settings.DB_PORT}, Database: {settings.DB_NAME}, "
            f"User: {settings.DB_USER}")

# Construct the database URL using settings
DATABASE_URL = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"

# Create the SQLAlchemy engine with important configuration options
engine = create_engine(
    DATABASE_URL,
    # Echo SQL statements for debugging (only in development)
    echo=settings.ENV == "development",
    
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
    Initialize database tables if they don't exist.
    No longer drops existing tables to preserve data.
    """
    try:
        # Check if tables exist by trying to query one of the main tables
        with engine.connect() as connection:
            # Try to query the products table as a test
            result = connection.execute(text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products')"))
            table_exists = result.scalar()
            
            
            if not table_exists:
                logger.info("Tables don't exist. Creating new tables...")
                Base.metadata.create_all(bind=engine)
                logger.info("Created new tables successfully")
                # Create default categories after tables are created
                create_default_categories()
            else:
                logger.info("Tables already exist. Skipping initialization.")
            
                
    except Exception as e:
        logger.error(f"Database initialization check failed: {str(e)}")
        raise

def create_default_categories():
    """
    Create default product categories if they don't exist.
    """
    from models import ProductCategory
    
    default_categories = [
        "Playmat",
        "Deckbox",
        "Sleeves",
        "Card"
    ]
    
    db = SessionLocal()
    try:
        for category_name in default_categories:
            # Check if category already exists
            existing_category = db.query(ProductCategory).filter(
                ProductCategory.category_name == category_name
            ).first()
            
            if not existing_category:
                new_category = ProductCategory(
                    category_name=category_name,
                    parent_category_id=None
                )
                db.add(new_category)
                logger.info(f"Created default category: {category_name}")
        
        db.commit()
        logger.info("Default categories check/creation completed")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating default categories: {str(e)}")
        raise
    finally:
        db.close()

def first_time_init():
    """
    First time initialization function that creates all tables.
    Should only be used for first deployment or when explicitly needed.
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Created all tables successfully")
    except Exception as e:
        logger.error(f"First time database initialization failed: {str(e)}")
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
            connection.execute(text("SELECT 1"))
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
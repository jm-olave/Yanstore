from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import logging

# Set up logging to help us understand database operations
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Database configuration parameters with fallback default values
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "productdb")

# Construct the database URL
# Format: postgresql://username:password@host:port/database_name
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create the SQLAlchemy engine with important configuration options
engine = create_engine(
    DATABASE_URL,
    # Echo SQL statements for debugging (set to False in production)
    echo=True,
    
    # Connection pool settings
    pool_size=5,  # Maximum number of permanent connections
    max_overflow=10,  # Maximum number of additional connections
    pool_timeout=30,  # Timeout in seconds for getting connection from pool
    
    # Enable automatic reconnection if connection is lost
    pool_pre_ping=True,
    
    # Connection arguments for better performance and security
    connect_args={
        "application_name": "YanStore Backend",  # Identify application in database logs
        "client_encoding": "utf8",
        "connect_timeout": 10  # Connection timeout in seconds
    }
)

# Create session factory
# autocommit=False: Transactions must be committed explicitly
# autoflush=False: Changes won't be flushed to DB automatically before each query
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
    Use this during development when you need a fresh start.
    """
    try:
        # Drop everything
        Base.metadata.drop_all(bind=engine)
        logger.info("Dropped all existing tables")
        
        # Create fresh tables
        Base.metadata.create_all(bind=engine)
        logger.info("Created new tables successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise

def get_db():
    """
    Dependency function that creates a new database session for each request.
    Used by FastAPI's dependency injection system.
    
    Yields:
        Session: A SQLAlchemy session object
        
    Example:
        @app.get("/products/")
        def get_products(db: Session = Depends(get_db)):
            return db.query(Product).all()
    """
    db = SessionLocal()
    try:
        # Provide the database session to the calling function
        yield db
    finally:
        # Ensure the session is closed after the request is complete
        db.close()

def verify_db_connection():
    """
    Verify that we can connect to the database.
    Useful for health checks and initial setup verification.
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        # Try to connect and execute a simple query
        with engine.connect() as connection:
            connection.execute("SELECT 1")
            logger.info("Database connection verified successfully")
            return True
    except Exception as e:
        logger.error(f"Database connection verification failed: {str(e)}")
        return False

# Example usage of environment variables for different environments
def get_db_config():
    """
    Get the current database configuration.
    Useful for debugging and verification.
    
    Returns:
        dict: Current database configuration (excluding sensitive information)
    """
    return {
        "host": DB_HOST,
        "port": DB_PORT,
        "database": DB_NAME,
        "user": DB_USER,
        "connected": verify_db_connection()
    }
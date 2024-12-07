from sqlalchemy import text
from database import engine, SessionLocal
import logging

# Set up logging to see what's happening
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_database_connection():
    """
    Tests the database connection by:
    1. Attempting to create a new database session
    2. Executing a simple query
    3. Checking if tables exist
    """
    try:
        # Test 1: Try to connect to the database
        logger.info("Testing database connection...")
        with engine.connect() as connection:
            logger.info("Successfully connected to the database!")

        # Test 2: Try to create a session
        logger.info("Testing session creation...")
        db = SessionLocal()
        try:
            # Test 3: Execute a simple query
            result = db.execute(text("SELECT version();"))
            version = result.scalar()
            logger.info(f"Database version: {version}")

            # Test 4: Check for our tables
            logger.info("Checking for tables...")
            result = db.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result]
            logger.info("Found tables:")
            for table in tables:
                logger.info(f"  - {table}")

            if not tables:
                logger.warning("No tables found in the database!")

        finally:
            db.close()
            logger.info("Database session closed successfully")

    except Exception as e:
        logger.error(f"Database connection test failed: {str(e)}")
        raise

if __name__ == "__main__":
    test_database_connection()
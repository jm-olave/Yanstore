#!/usr/bin/env python3
"""
Migration script to create ProductInstance records for existing Products
that don't have corresponding instances.

This script will:
1. Find all Products without ProductInstance records
2. Create ProductInstance records using data from PricePoint or default values
3. Handle edge cases and provide detailed logging
"""

import sys
import os
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import logging

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Base, engine
from models import Product, ProductInstance, PricePoint

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def get_database_url():
    """Get database URL from environment or use default"""
    return os.getenv('DATABASE_URL', 'postgresql://username:password@localhost/yanstore')

def migrate_products_to_instances():
    """Main migration function"""
    try:
        # Create database session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        logger.info("Starting migration: Products to ProductInstances")
        
        # Find all products that don't have ProductInstance records
        products_without_instances = db.query(Product).outerjoin(
            ProductInstance, Product.product_id == ProductInstance.product_id
        ).filter(ProductInstance.instance_id.is_(None)).all()
        
        logger.info(f"Found {len(products_without_instances)} products without instances")
        
        if not products_without_instances:
            logger.info("No products need migration. All products already have instances.")
            return
        
        migrated_count = 0
        skipped_count = 0
        error_count = 0
        
        for product in products_without_instances:
            try:
                logger.info(f"Processing product: {product.name} (ID: {product.product_id})")
                
                # Try to get base cost from PricePoint
                price_point = db.query(PricePoint).filter(
                    PricePoint.product_id == product.product_id
                ).order_by(PricePoint.created_at.desc()).first()
                
                base_cost = None
                if price_point:
                    base_cost = price_point.base_cost
                    logger.info(f"Using base cost from PricePoint: ${base_cost}")
                else:
                    # Use a default base cost if no PricePoint exists
                    base_cost = Decimal('0.00')
                    logger.warning(f"No PricePoint found for product {product.name}, using default base cost: ${base_cost}")
                
                # Create ProductInstance
                instance = ProductInstance(
                    product_id=product.product_id,
                    base_cost=base_cost,
                    status='available',
                    purchase_date=product.purchase_date or date.today(),
                    location=product.location or 'Colombia'  # Default location
                )
                
                db.add(instance)
                db.flush()  # Flush to get the instance_id
                
                logger.info(f"Created ProductInstance {instance.instance_id} for product {product.name}")
                migrated_count += 1
                
            except SQLAlchemyError as e:
                logger.error(f"Database error processing product {product.product_id}: {e}")
                db.rollback()
                error_count += 1
                continue
            except Exception as e:
                logger.error(f"Unexpected error processing product {product.product_id}: {e}")
                db.rollback()
                error_count += 1
                continue
        
        # Commit all changes
        db.commit()
        
        logger.info(f"Migration completed:")
        logger.info(f"  - Successfully migrated: {migrated_count} products")
        logger.info(f"  - Skipped: {skipped_count} products")
        logger.info(f"  - Errors: {error_count} products")
        
        # Verify migration
        verify_migration(db)
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def verify_migration(db):
    """Verify that the migration was successful"""
    try:
        # Count products without instances
        products_without_instances = db.query(Product).outerjoin(
            ProductInstance, Product.product_id == ProductInstance.product_id
        ).filter(ProductInstance.instance_id.is_(None)).count()
        
        # Count total instances
        total_instances = db.query(ProductInstance).count()
        
        logger.info(f"Verification results:")
        logger.info(f"  - Products without instances: {products_without_instances}")
        logger.info(f"  - Total ProductInstances: {total_instances}")
        
        if products_without_instances == 0:
            logger.info("✅ Migration verification successful: All products now have instances")
        else:
            logger.warning(f"⚠️  Migration verification: {products_without_instances} products still lack instances")
            
    except Exception as e:
        logger.error(f"Verification failed: {e}")

def rollback_migration():
    """Rollback function to remove all ProductInstance records created by this migration"""
    try:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        logger.info("Starting rollback: Removing ProductInstance records")
        
        # Delete all ProductInstance records
        deleted_count = db.query(ProductInstance).delete()
        db.commit()
        
        logger.info(f"Rollback completed: Deleted {deleted_count} ProductInstance records")
        
    except Exception as e:
        logger.error(f"Rollback failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrate Products to ProductInstances')
    parser.add_argument('--rollback', action='store_true', help='Rollback the migration')
    
    args = parser.parse_args()
    
    if args.rollback:
        logger.info("Starting rollback process...")
        rollback_migration()
    else:
        logger.info("Starting migration process...")
        migrate_products_to_instances() 
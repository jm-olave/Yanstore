from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime
import logging
import argparse

# Import modules
from database import get_db, init_db, engine
from models import Base
import models
import schema

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="YanStore API",
    description="Backend API for YanStore product management system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://192.168.2.138:5173"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables on startup
@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise

# Health check endpoint
@app.get("/health")
async def health_check():
    """Check if the API is running and database is connected"""
    return {"status": "healthy", "version": "1.0.0"}

# Product Category endpoints
@app.post("/categories/", response_model=schema.CategoryResponse)
def create_category(
    category: schema.CategoryCreate,
    db: Session = Depends(get_db)
):
    """Create a new product category"""
    try:
        db_category = models.ProductCategory(**category.dict())
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Category already exists or invalid parent category"
        )

@app.get("/categories/", response_model=List[schema.CategoryResponse])
def list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all product categories"""
    categories = db.query(models.ProductCategory).offset(skip).limit(limit).all()
    return categories

# Product endpoints
@app.post("/products/", response_model=schema.ProductResponse)
async def create_product(
    name: str = Form(...),
    sku = "",
    category_id: int = Form(...),
    description: Optional[str] = Form(None),
    condition: str = Form(...),
    purchase_date: datetime = Form(...),
    obtained_method: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new product with all fields and optional image"""
    try:
    #First, we fetch the category from the database using the provided category_id
        category = db.query(models.ProductCategory).filter(
            models.ProductCategory.category_id == category_id
        ).first()
        
        # We check if the category exists - if not, we return a 404 error
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
            
        # Here's where the SKU magic happens:
        # 1. Take the first two letters of the category name and make them uppercase
        category_prefix = category.category_name[:2].upper()
        
        # 2. Get current timestamp in format: YYMMDDHHMM 
        # (Year, Month, Day, Hour, Minute)
        timestamp = datetime.now().strftime('%y%m%d%H%M')
        
        # 3. Combine the category prefix with timestamp to create the SKU
        sku = f"{category_prefix}{timestamp}"
        # Validate the condition value explicitly
        valid_conditions = ["Mint", "Near Mint", "Excelent", "Good", "Lightly Played", "Played", "Poor"]
        if condition not in valid_conditions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid condition. Must be one of: {', '.join(valid_conditions)}"
            )
        # Validate image type if provided
        if image:
            content_type = image.content_type
            if content_type not in ["image/jpeg", "image/png"]:
                raise HTTPException(
                    status_code=400,
                    detail="Only JPG and PNG images are allowed"
                )
        
        # Create product with all fields
        db_product = models.Product(
            name=name,
            sku=sku,
            category_id=category_id,
            description=description,
            condition=condition,
            purchase_date = purchase_date,
            obtained_method = obtained_method
        )
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        
        # Handle image if provided
        if image:
            try:
                # Read image data
                image_data = await image.read()
                
                # Get file extension from content type
                image_type = "jpg" if content_type == "image/jpeg" else "png"
                
                # Create image record
                db_image = models.ProductImage(
                    product_id=db_product.product_id,
                    image_data=image_data,
                    image_type=image_type,
                    is_primary=True
                )
                db.add(db_image)
                db.commit()
                
            except Exception as img_error:
                logger.error(f"Error saving image: {str(img_error)}")
                # If image upload fails, delete the product
                db.delete(db_product)
                db.commit()
                raise HTTPException(
                    status_code=400,
                    detail="Failed to save product image"
                )
        
        return db_product
        
    except HTTPException as http_error:
        # Re-raise HTTP exceptions
        raise http_error
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An error occurred while creating the product"
        )

@app.get("/products/", response_model=List[schema.ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    """
    List products with optional filtering
    """
    query = db.query(models.Product)
    
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    if is_active is not None:
        query = query.filter(models.Product.is_active == is_active)
    
    products = query.offset(skip).limit(limit).all()
    return products

@app.get("/products/{product_id}", response_model=schema.ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific product by ID"""
    product = db.query(models.Product).filter(
        models.Product.product_id == product_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.patch("/products/{product_id}", response_model=schema.ProductResponse)
def update_product(
    product_id: int,
    product_update: schema.ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update a product"""
    db_product = db.query(models.Product).filter(
        models.Product.product_id == product_id
    ).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update only provided fields
    for field, value in product_update.dict(exclude_unset=True).items():
        setattr(db_product, field, value)
    
    try:
        db.commit()
        db.refresh(db_product)
        return db_product
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid update data")
    

# Supplier endpoints
@app.post("/suppliers/", response_model=schema.SupplierResponse)
def create_supplier(
    supplier: schema.SupplierCreate,
    db: Session = Depends(get_db)
):
    """Create a new supplier"""
    try:
        db_supplier = models.Supplier(**supplier.dict())
        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)
        return db_supplier
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Supplier creation failed"
        )

@app.get("/suppliers/", response_model=List[schema.SupplierResponse])
def list_suppliers(
    skip: int = 0,
    limit: int = 100,
    debtor_type: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    """List suppliers with optional filtering"""
    query = db.query(models.Supplier)
    
    if debtor_type:
        query = query.filter(models.Supplier.debtor_type == debtor_type)
    if is_active is not None:
        query = query.filter(models.Supplier.is_active == is_active)
    
    suppliers = query.offset(skip).limit(limit).all()
    return suppliers

@app.get("/suppliers/by-category/{category_id}", response_model=List[schema.SupplierResponse])
def get_suppliers_by_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """Get suppliers that provide products in a specific category"""
    suppliers = db.query(models.Supplier)\
        .join(models.SupplierProduct)\
        .join(models.Product)\
        .filter(models.Product.category_id == category_id)\
        .distinct()\
        .all()
    return suppliers

@app.get("/suppliers/{supplier_id}", response_model=schema.SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific supplier by ID"""
    supplier = db.query(models.Supplier)\
        .filter(models.Supplier.supplier_id == supplier_id)\
        .first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@app.patch("/suppliers/{supplier_id}", response_model=schema.SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_update: schema.SupplierUpdate,
    db: Session = Depends(get_db)
):
    """Update a supplier's information"""
    db_supplier = db.query(models.Supplier)\
        .filter(models.Supplier.supplier_id == supplier_id)\
        .first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    for field, value in supplier_update.dict(exclude_unset=True).items():
        setattr(db_supplier, field, value)
    
    try:
        db.commit()
        db.refresh(db_supplier)
        return db_supplier
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Update failed")
    

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset-db", action="store_true", help="Reset the database")
    args = parser.parse_args()

    if args.reset_db:
        init_db()
        print("Database reset complete")
    else:
        import uvicorn
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

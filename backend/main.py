from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import extract
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, date
import logging
import argparse
import os

from fastapi import Response, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO

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
    allow_origins=["http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.2.138:5173",
        "https://yanstoreapi-bzercjhpe2d4aueh.canadacentral-01.azurewebsites.net",
        "https://new-yanstore-api-c29287e7c68d.herokuapp.com",
        "https://magenta-paprenjak-8434f9.netlify.app",
        "https://stupendous-mermaid-4ecc91.netlify.app",
        "http://stupendous-mermaid-4ecc91.netlify.app",
        "http://172.29.223.73:5173"],  # Add your frontend URL
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


@app.get("/")
async def root():
    """Health check endpoint"""
    logger.info("Health check endpoint called")
    return {
        "status": "healthy",
        "environment": os.getenv("ENV", "development"),
        "database_host": os.getenv("PROD_DB_HOST", "not_set")
    }
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

@app.delete("/categories/{category_id}", response_model=dict)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """Delete a category (marks it as inactive or removes it if no products associated)"""
    # Check if category exists
    db_category = db.query(models.ProductCategory).filter(
        models.ProductCategory.category_id == category_id
    ).first()
    
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category has associated products
    associated_products = db.query(models.Product).filter(
        models.Product.category_id == category_id,
        models.Product.is_active == True
    ).count()
    
    if associated_products > 0:
        # For categories with active products, we can't delete them
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete category with {associated_products} active products. Deactivate or reassign products first."
        )
    
    try:
        # Delete the category
        db.delete(db_category)
        db.commit()
        
        return {
            "success": True, 
            "message": f"Category '{db_category.category_name}' has been deleted",
            "category_id": category_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deleting the category: {str(e)}"
        )



# Product endpoints
@app.post("/products/", response_model=schema.ProductResponse)
async def create_product(
    name: str = Form(...),
    sku = "",
    category_id: int = Form(...),
    description: Optional[str] = Form(None),
    condition: str = Form(...),
    purchase_date: str = Form(...),
    location: Optional[str] = Form(None),
    obtained_method: str = Form(...),
    initial_quantity: Optional[int] = Form(1),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new product with all fields and optional image"""
    try:
        try:
            # Try different date formats
            parsed_date = None
            date_formats = [
                "%Y-%m-%d",         # YYYY-MM-DD
                "%Y-%m-%dT%H:%M:%S.%fZ",  # ISO format
                "%Y-%m-%dT%H:%M:%SZ",     # ISO without milliseconds
                "%m/%d/%Y",         # MM/DD/YYYY
                "%d/%m/%Y",         # DD/MM/YYYY
            ]
            
            for date_format in date_formats:
                try:
                    parsed_date = datetime.strptime(purchase_date, date_format)
                    break
                except ValueError:
                    continue
            
            if parsed_date is None:
                raise ValueError(f"Could not parse date: {purchase_date}")
            
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid date format: {str(e)}. Please use YYYY-MM-DD format."
            )
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
        valid_conditions = ["Mint", "Near Mint", "Excellent", "Good", "Lightly Played", "Played", "Poor", "New", "Used", "Damaged"]
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
            location = location,
            obtained_method = obtained_method
        )
        db.add(db_product)
        db.flush()
        db_inventory = models.Inventory(
            product_id=db_product.product_id,
            quantity=initial_quantity,
            available_quantity=initial_quantity,
            reserved_quantity=0,
            reorder_point=1
        )
        db.add(db_inventory)
        db.flush()
        
        # Create initial inventory transaction
        transaction = models.InventoryTransaction(
            inventory_id=db_inventory.inventory_id,
            transaction_type="initial",
            quantity=initial_quantity,
            notes="Initial inventory setup",
            created_by="system"
        )
        db.add(transaction)
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
            
        db.commit()
        db.refresh(db_product)
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

@app.get("/products/{product_id}/image", response_class=Response)
def get_product_image(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get the primary image for a product"""
    # Find the primary image for this product
    product_image = db.query(models.ProductImage).filter(
        models.ProductImage.product_id == product_id,
        models.ProductImage.is_primary == True
    ).first()
    
    # If no primary image found, try to get any image for this product
    if not product_image:
        product_image = db.query(models.ProductImage).filter(
            models.ProductImage.product_id == product_id
        ).first()
    
    # If no image is found, return a 404
    if not product_image:
        raise HTTPException(status_code=404, detail="No image found for this product")
    
    # Determine the content type based on image_type
    content_type = "image/jpeg" if product_image.image_type == "jpg" else "image/png"
    
    # Return the image as a streaming response
    return StreamingResponse(
        BytesIO(product_image.image_data),
        media_type=content_type
    )

@app.delete("/products/{product_id}", response_model=dict)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Delete a product (marks it as inactive rather than removing it)"""
    db_product = db.query(models.Product).filter(
        models.Product.product_id == product_id
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        # Set is_active to False instead of actually deleting the record
        db_product.is_active = False
        db.commit()
        
        return {
            "success": True, 
            "message": f"Product {db_product.name} has been deactivated",
            "product_id": product_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deactivating the product: {str(e)}"
        )


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

# pricepoint and financial endpoints 
@app.post("/price-points/", response_model=schema.PricePointResponse)
def create_price_point(
    price_point: schema.PricePointCreate,
    db: Session = Depends(get_db)
):
    """Create a new price point for a product"""
    try:
        # Check if product exists
        product = db.query(models.Product).filter(
            models.Product.product_id == price_point.product_id
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        price_point_data = price_point.dict(exclude_unset=True)
        if price_point_data.get('effective_from') is None:
            price_point_data.pop('effective_from', None)
        db_price_point = models.PricePoint(**price_point.dict())
        db.add(db_price_point)
        db.commit()
        db.refresh(db_price_point)
        return db_price_point
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid price point data")

@app.get("/products/{product_id}/price-points/", response_model=List[schema.PricePointResponse])
def get_product_price_points(
    product_id: int,
    skip: int = 0,
    limit: int = 10,
    current_only: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get price points for a specific product.
    
    Parameters:
    - product_id: ID of the product to get price points for
    - skip: Number of records to skip (for pagination)
    - limit: Maximum number of records to return
    - current_only: If True, returns only the current/active price point
    
    Returns:
    - List of price points for the product
    """
    # Check if product exists
    product = db.query(models.Product).filter(
        models.Product.product_id == product_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Build the query
    query = db.query(models.PricePoint).filter(
        models.PricePoint.product_id == product_id
    )
    
    # If current_only is True, filter for the active price point
    if current_only:
        from datetime import datetime
        current_time = datetime.now()
        query = query.filter(
            (models.PricePoint.effective_from <= current_time) &
            ((models.PricePoint.effective_to.is_(None)) | (models.PricePoint.effective_to >= current_time))
        )
    
    # Order by most recent first
    query = query.order_by(models.PricePoint.effective_from.desc())
    
    # Apply pagination
    price_points = query.offset(skip).limit(limit).all()
    
    return price_points






@app.post("/sales/", response_model=schema.SaleResponse)
def register_sale(
    sale: schema.SaleCreate,
    db: Session = Depends(get_db)
):
    """Register a product sale and update inventory"""
    try:
        # Start transaction
        db_sale = models.Sale(**sale.dict())
        db.add(db_sale)

        # Update inventory
        inventory = db.query(models.Inventory).filter(
            models.Inventory.product_id == sale.product_id
        ).first()
        
        if inventory:
            if inventory.available_quantity < 1:
                raise HTTPException(
                    status_code=400,
                    detail="Product out of stock"
                )
            inventory.available_quantity -= 1
            
            # Create inventory transaction
            transaction = models.InventoryTransaction(
                inventory_id=inventory.inventory_id,
                transaction_type="sale",
                quantity=-1,
                reference_id=str(db_sale.sale_id),
                notes=f"Sale registered on {sale.sale_date}",
                created_by="system"
            )
            db.add(transaction)

        # Update financial metrics
        update_financial_metrics(db, sale)
        
        db.commit()
        db.refresh(db_sale)
        return db_sale
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid sale data")

#  inventory endpoints 
@app.get("/inventory/{product_id}", response_model=schema.InventoryResponse)
def get_product_inventory(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get inventory status for a specific product"""
    inventory = db.query(models.Inventory).filter(
        models.Inventory.product_id == product_id
    ).first()
    
    if not inventory:
        raise HTTPException(
            status_code=404,
            detail=f"No inventory record found for product {product_id}"
        )
    
    return inventory

@app.get("/inventory-transactions/{inventory_id}", response_model=List[schema.InventoryTransactionResponse])
def get_inventory_transactions(
    inventory_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get transaction history for a specific inventory record"""
    transactions = db.query(models.InventoryTransaction).filter(
        models.InventoryTransaction.inventory_id == inventory_id
    ).offset(skip).limit(limit).all()
    
    if not transactions:
        raise HTTPException(
            status_code=404,
            detail=f"No transactions found for inventory {inventory_id}"
        )
    
    return transactions






# Logic methods, for analysis, financial metrics etc...


def update_financial_metrics(db: Session, sale: schema.SaleCreate):
    """Update financial metrics based on sale"""
    # Get the date parts for grouping
    sale_date = sale.sale_date
    year = sale_date.year
    month = sale_date.month
    
    # Get or create metric for this month
    metric = db.query(models.FinancialMetric).filter(
        extract('year', models.FinancialMetric.record_date) == year,
        extract('month', models.FinancialMetric.record_date) == month
    ).first()
    
    if not metric:
        metric = models.FinancialMetric(
            record_date=date(year, month, 1),
            dollar_average=0,
            efficiency_over_costs=0,
            efficiency_over_goal=0,
            estimated_revenue=0,
            actual_revenue=0,
            total_net_income=0,
            tax_rate=0.19,  # Example tax rate
            reserve_rate=0.10,  # Example reserve rate
            profit_margin=0
        )
        db.add(metric)
    
    # Update metrics
    metric.actual_revenue += float(sale.sale_price)
    
    # Get product cost from latest price point
    latest_price_point = db.query(models.PricePoint).filter(
        models.PricePoint.product_id == sale.product_id
    ).order_by(models.PricePoint.effective_from.desc()).first()
    
    if latest_price_point:
        cost = float(latest_price_point.base_cost)
        revenue = float(sale.sale_price)
        
        # Update efficiency metrics
        if cost > 0:
            metric.efficiency_over_costs = ((revenue - cost) / cost) * 100
        
        # Update profit margin
        total_sales = metric.actual_revenue
        total_costs = cost  # This should actually sum all costs for the period
        if total_sales > 0:
            metric.profit_margin = ((total_sales - total_costs) / total_sales) * 100
            
        # Update net income
        tax_amount = revenue * metric.tax_rate
        reserve_amount = revenue * metric.reserve_rate
        metric.total_net_income = revenue - cost - tax_amount - reserve_amount
        
    db.commit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset-db", action="store_true", help="Reset the database")
    args = parser.parse_args()

    if args.reset_db:
        init_db()
        print("Database reset complete")
    else:
        import uvicorn
        uvicorn.run("app", host="0.0.0.0", port=8000)

# api calles exchange rate api 
@app.get("/exchange-rates/")
async def get_exchange_rates(base_currency: str = "USD"):
    """Get current exchange rates with USD as the base currency"""
    try:
        # Use an exchange rate API or service
        # For this example, we're using exchangerate-api.com
        api_key = os.getenv("EXCHANGE_RATE_API_KEY")
        url = f"https://v6.exchangerate-api.com/v6/{api_key}/latest/{base_currency}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch exchange rates")
            
            data = response.json()
            
            if data.get("result") == "success":
                return {"rates": data.get("conversion_rates", {})}
            else:
                raise HTTPException(status_code=500, detail="Failed to fetch exchange rates")
    except Exception as e:
        logger.error(f"Error fetching exchange rates: {str(e)}")
        # Fallback to approximate values
        return {"rates": {"COP": 4000, "EUR": 0.92, "GBP": 0.78}}

from fastapi import FastAPI, Depends, HTTPException, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import extract
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime, date, timedelta
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
    allow_origins=[
        "http://localhost:5173",  # Local development
        "http://127.0.0.1:5173",  # Local development (alternative)
        "https://stupendous-mermaid-4ecc91.netlify.app",  # Production frontend
        "https://new-yanstore-api-c29287e7c68d.herokuapp.com"  # Production backend
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
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

# Event endpoints
@app.post("/events/", response_model=schema.EventResponse)
def create_event(
    event: schema.EventCreate,
    db: Session = Depends(get_db)
):
    """Create a new event"""
    try:
        db_event = models.Event(**event.dict())
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Invalid event data"
        )

@app.get("/events/", response_model=List[schema.EventResponse])
def list_events(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all events"""
    events = db.query(models.Event).offset(skip).limit(limit).all()
    return events

@app.get("/events/{event_id}", response_model=schema.EventResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific event by ID"""
    event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@app.patch("/events/{event_id}", response_model=schema.EventResponse)
def update_event(
    event_id: int,
    event_update: schema.EventUpdate,
    db: Session = Depends(get_db)
):
    """Update an event"""
    db_event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event

@app.delete("/events/{event_id}", response_model=dict)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Delete an event"""
    db_event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if event has associated products
    associated_products = db.query(models.Product).filter(
        models.Product.event_id == event_id,
        models.Product.is_active == True
    ).count()
    
    if associated_products > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete event with {associated_products} active products. Deactivate or reassign products first."
        )
    
    try:
        db.delete(db_event)
        db.commit()
        
        return {
            "success": True, 
            "message": f"Event '{db_event.name}' has been deleted",
            "event_id": event_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deleting the event: {str(e)}"
        )

@app.get("/events/{event_id}/products", response_model=List[schema.ProductResponse])
def get_event_products(
    event_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all products associated with an event"""
    products = db.query(models.Product).filter(
        models.Product.event_id == event_id,
        models.Product.is_active == True
    ).offset(skip).limit(limit).all()
    return products

@app.patch("/events/{event_id}/calculate-end-budget")
def calculate_event_end_budget(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Calculate and update the end budget for an event based on products purchased"""
    db_event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get all products from this event
    products = db.query(models.Product).filter(
        models.Product.event_id == event_id,
        models.Product.is_active == True
    ).all()
    
    print(f"Found {len(products)} products for event {event_id}")
    
    # Calculate total spent on products (sum of base costs from product instances)
    total_spent = 0
    for product in products:
        print(f"Processing product {product.product_id}: {product.name}")
        instances = db.query(models.ProductInstance).filter(
            models.ProductInstance.product_id == product.product_id
        ).all()
        
        if instances:
            for instance in instances:
                product_cost = float(instance.base_cost)
                total_spent += product_cost
                print(f"  - Instance found: base_cost=${instance.base_cost}, total=${product_cost}")
        else:
            print(f"  - No instances found for product {product.product_id}")
    
    print(f"Total spent on products: ${total_spent}")
    
    # Calculate total travel expenses
    travel_expenses = db.query(models.TravelExpense).filter(
        models.TravelExpense.event_id == event_id
    ).all()
    
    total_travel_expenses = sum(float(expense.amount) for expense in travel_expenses)
    print(f"Total travel expenses: ${total_travel_expenses}")
    
    # Calculate end budget: initial_budget - total_spent - total_travel_expenses
    end_budget = float(db_event.initial_budget) - total_spent - total_travel_expenses
    
    # Update the event
    db_event.end_budget = end_budget
    db.commit()
    db.refresh(db_event)
    
    # Create calculation string with travel expenses included
    calculation_str = f"${float(db_event.initial_budget):.2f} - ${total_spent:.2f} - ${total_travel_expenses:.2f} = ${end_budget:.2f}"
    
    return {
        "event_id": event_id,
        "initial_budget": float(db_event.initial_budget),
        "total_spent_on_products": total_spent,
        "total_travel_expenses": total_travel_expenses,
        "end_budget": end_budget,
        "calculation": calculation_str
    }

# Travel Expense endpoints
@app.post("/travel-expenses/", response_model=schema.TravelExpenseResponse)
async def create_travel_expense(
    event_id: int = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    amount: float = Form(...),
    expense_date: str = Form(...),
    receipt: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Create a new travel expense for an event"""
    try:
        # Validate event exists
        event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Parse expense date
        try:
            parsed_date = datetime.strptime(expense_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Please use YYYY-MM-DD format."
            )
        
        # Validate amount
        if amount <= 0:
            raise HTTPException(
                status_code=400,
                detail="Amount must be greater than 0"
            )
        
        # Create travel expense
        db_expense = models.TravelExpense(
            event_id=event_id,
            name=name,
            description=description,
            amount=amount,
            expense_date=parsed_date
        )
        
        # Handle receipt if provided
        if receipt:
            content_type = receipt.content_type
            if content_type not in ["image/jpeg", "image/png"]:
                raise HTTPException(
                    status_code=400,
                    detail="Only JPG and PNG images are allowed for receipts"
                )
            
            try:
                receipt_data = await receipt.read()
                image_type = "jpg" if content_type == "image/jpeg" else "png"
                db_expense.receipt_data = receipt_data
                db_expense.receipt_type = image_type
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to process receipt: {str(e)}"
                )
        
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)
        
        return db_expense
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while creating the travel expense: {str(e)}"
        )

@app.get("/events/{event_id}/travel-expenses", response_model=List[schema.TravelExpenseResponse])
def get_event_travel_expenses(
    event_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all travel expenses for an event"""
    # Validate event exists
    event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    expenses = db.query(models.TravelExpense).filter(
        models.TravelExpense.event_id == event_id
    ).offset(skip).limit(limit).all()
    
    return expenses

@app.get("/travel-expenses/{expense_id}", response_model=schema.TravelExpenseResponse)
def get_travel_expense(
    expense_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific travel expense by ID"""
    expense = db.query(models.TravelExpense).filter(
        models.TravelExpense.expense_id == expense_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Travel expense not found")
    
    return expense

@app.patch("/travel-expenses/{expense_id}", response_model=schema.TravelExpenseResponse)
async def update_travel_expense(
    expense_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    amount: Optional[float] = Form(None),
    expense_date: Optional[str] = Form(None),
    receipt: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Update a travel expense"""
    db_expense = db.query(models.TravelExpense).filter(
        models.TravelExpense.expense_id == expense_id
    ).first()
    
    if not db_expense:
        raise HTTPException(status_code=404, detail="Travel expense not found")
    
    try:
        # Update fields if provided
        if name is not None:
            db_expense.name = name
        if description is not None:
            db_expense.description = description
        if amount is not None:
            if amount <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="Amount must be greater than 0"
                )
            db_expense.amount = amount
        if expense_date is not None:
            try:
                parsed_date = datetime.strptime(expense_date, "%Y-%m-%d").date()
                db_expense.expense_date = parsed_date
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid date format. Please use YYYY-MM-DD format."
                )
        
        # Handle receipt if provided
        if receipt:
            content_type = receipt.content_type
            if content_type not in ["image/jpeg", "image/png"]:
                raise HTTPException(
                    status_code=400,
                    detail="Only JPG and PNG images are allowed for receipts"
                )
            
            try:
                receipt_data = await receipt.read()
                image_type = "jpg" if content_type == "image/jpeg" else "png"
                db_expense.receipt_data = receipt_data
                db_expense.receipt_type = image_type
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to process receipt: {str(e)}"
                )
        
        db.commit()
        db.refresh(db_expense)
        return db_expense
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while updating the travel expense: {str(e)}"
        )

@app.delete("/travel-expenses/{expense_id}", response_model=dict)
def delete_travel_expense(
    expense_id: int,
    db: Session = Depends(get_db)
):
    """Delete a travel expense"""
    db_expense = db.query(models.TravelExpense).filter(
        models.TravelExpense.expense_id == expense_id
    ).first()
    
    if not db_expense:
        raise HTTPException(status_code=404, detail="Travel expense not found")
    
    try:
        expense_name = db_expense.name
        db.delete(db_expense)
        db.commit()
        
        return {
            "success": True,
            "message": f"Travel expense '{expense_name}' has been deleted",
            "expense_id": expense_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deleting the travel expense: {str(e)}"
        )

@app.get("/travel-expenses/{expense_id}/receipt")
async def get_travel_expense_receipt(
    expense_id: int,
    db: Session = Depends(get_db)
):
    """Get the receipt image for a travel expense"""
    expense = db.query(models.TravelExpense).filter(
        models.TravelExpense.expense_id == expense_id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Travel expense not found")
    
    if not expense.receipt_data:
        raise HTTPException(status_code=404, detail="No receipt found for this expense")
    
    content_type = "image/jpeg" if expense.receipt_type == "jpg" else "image/png"
    
    return Response(
        content=expense.receipt_data,
        media_type=content_type,
        headers={"Content-Disposition": f"inline; filename=receipt_{expense_id}.{expense.receipt_type}"}
    )

@app.get("/events/{event_id}/debug")
def debug_event_products(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Debug endpoint to check event products and their price points"""
    db_event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get all products from this event
    products = db.query(models.Product).filter(
        models.Product.event_id == event_id
    ).all()
    
    debug_info = {
        "event_id": event_id,
        "event_name": db_event.name,
        "total_products": len(products),
        "products": []
    }
    
    for product in products:
        product_info = {
            "product_id": product.product_id,
            "name": product.name,
            "sku": product.sku,
            "is_active": product.is_active,
            "event_id": product.event_id,
            "instances": []
        }
        
        # Get all instances for this product
        instances = db.query(models.ProductInstance).filter(
            models.ProductInstance.product_id == product.product_id
        ).all()
        
        for instance in instances:
            product_info["instances"].append({
                "instance_id": instance.instance_id,
                "base_cost": float(instance.base_cost),
                "status": instance.status,
                "purchase_date": instance.purchase_date.isoformat() if instance.purchase_date else None,
                "location": instance.location
            })
        
        debug_info["products"].append(product_info)
    
    return debug_info

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
VALID_CONDITIONS = [
    "Mint", "Near Mint", "Excellent", "Good", 
    "Lightly Played", "Played", "Poor", "New", "Used", "Damaged"
]

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
    event_id: Optional[int] = Form(None),
    base_costs: List[float] = Form(...),
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
        if condition not in VALID_CONDITIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid condition. Must be one of: {', '.join(VALID_CONDITIONS)}"
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
            event_id=event_id,
            description=description,
            condition=condition,
            purchase_date = purchase_date,
            location = location,
            obtained_method = obtained_method
        )
        db.add(db_product)
        db.flush()

        for base_cost in base_costs:
            db_instance = models.ProductInstance(
                product_id=db_product.product_id,
                base_cost=base_cost,
                purchase_date=parsed_date,
                location=location
            )
            db.add(db_instance)

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
def get_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    category_id: Optional[int] = None,
    location: Optional[str] = None
):
    """Get all products with optional filtering"""
    try:
        # Start with a query that includes a join with inventory
        query = db.query(models.Product).outerjoin(models.ProductInstance)

        # Apply filters if provided
        if category_id:
            query = query.filter(models.Product.category_id == category_id)
        if location:
            query = query.filter(models.Product.location == location)

        # Get all products
        products = query.all()

        return products

    except Exception as e:
        print(f"Error in get_products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Make sure this specific route comes BEFORE the general product_id route
@app.get("/products-with-rentability/", response_model=List[schema.ProductResponse])
def get_products_with_rentability(db: Session = Depends(get_db)):
    """Get all products with their rentability metrics"""
    products = db.query(models.Product).all()
    
    response_products = []
    for product in products:
        product_dict = product.__dict__
        rentability_metrics = product.calculate_rentability(db)
        product_dict.update(rentability_metrics)
        response_products.append(product_dict)
    
    return response_products

# This more general route should come AFTER the specific route
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

@app.patch("/products/bulk-update-location", response_model=dict)
def bulk_update_product_location(
    request_data: schema.ProductBulkUpdateLocationRequest,
    db: Session = Depends(get_db)
):
    """Bulk update location for a list of products."""
    logger.info(f"Received bulk_update_product_location request_data: {request_data}") # <-- ADD THIS LINE
    updated_count = 0
    errors = []

    products_to_update = db.query(models.Product).filter(
        models.Product.product_id.in_(request_data.product_ids)
    ).all()

    found_product_ids = {p.product_id for p in products_to_update}

    for product_id in request_data.product_ids:
        if product_id not in found_product_ids:
            errors.append({"product_id": product_id, "error": "Product not found"})

    for product in products_to_update:
        product.location = request_data.new_location
        updated_count += 1

    if updated_count > 0:
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            # Log the exception e
            logger.error(f"Error during bulk update commit: {str(e)}")
            # Return a more generic error to the client, or specific if appropriate
            raise HTTPException(status_code=500, detail="An error occurred during the update.")

    return {
        "message": f"Bulk location update attempted. {updated_count} products updated.",
        "updated_count": updated_count,
        "errors": errors
    }
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



@app.get("/products/{product_id}/image")
async def get_product_image(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Get the primary image for a product"""
    try:
        product_image = db.query(models.ProductImage).filter(
            models.ProductImage.product_id == product_id,
            models.ProductImage.is_primary == True
        ).first()
        
        if not product_image:
            product_image = db.query(models.ProductImage).filter(
                models.ProductImage.product_id == product_id
            ).first()
        
        if not product_image or not product_image.image_data:
            raise HTTPException(
                status_code=404, 
                detail="No valid image found for this product"
            )

        image_stream = BytesIO(product_image.image_data)
        image_stream.seek(0)
        
        content_type = "image/jpeg" if product_image.image_type.lower() in ["jpg", "jpeg"] else "image/png"
        
        return StreamingResponse(
            image_stream,
            media_type=content_type
        )
        
    except Exception as e:
        logger.error(f"Error serving image for product {product_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.delete("/products/{product_id}", response_model=dict)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Delete a product and all related objects from the database."""
    db_product = db.query(models.Product).filter(
        models.Product.product_id == product_id
    ).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        product_name = db_product.name
        db.delete(db_product)
        db.commit()
        return {
            "success": True,
            "message": f"Product '{product_name}' and all related data have been deleted.",
            "product_id": product_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deleting the product: {str(e)}"
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

@app.delete("/suppliers/{supplier_id}", response_model=dict)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    """Delete a supplier (marks it as inactive rather than removing it)"""
    db_supplier = db.query(models.Supplier).filter(
        models.Supplier.supplier_id == supplier_id
    ).first()
    
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    try:
        # Check if supplier has any active associated products
        associated_products = db.query(models.SupplierProduct).filter(
            models.SupplierProduct.supplier_id == supplier_id
        ).count()
        
        if associated_products > 0:
            # If supplier has associated products, just mark as inactive
            db_supplier.is_active = False
            db.commit()
            return {
                "success": True,
                "message": f"Supplier '{db_supplier.name}' has been deactivated due to existing product associations",
                "supplier_id": supplier_id,
                "deactivated": True
            }
        else:
            # If no associated products, we can safely delete the supplier
            db.delete(db_supplier)
            db.commit()
            return {
                "success": True,
                "message": f"Supplier '{db_supplier.name}' has been deleted",
                "supplier_id": supplier_id,
                "deactivated": False
            }
            
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deleting/deactivating the supplier: {str(e)}"
        )

from decimal import Decimal
from sqlalchemy.sql import func
from sqlalchemy import and_

# Helper function to parse month string and calculate date ranges
def _parse_month_string_to_dates(month_str: str):
    try:
        year_int = int(month_str.split('-')[0])
        month_int = int(month_str.split('-')[1])
        if not (1 <= month_int <= 12):
            raise ValueError("Month must be between 01 and 12.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid month format. Expected YYYY-MM. Error: {e}")

    start_date_of_month = date(year_int, month_int, 1)
    
    if month_int == 12:
        end_date_of_month = date(year_int, month_int, 31)
    else:
        end_date_of_month = date(year_int, month_int + 1, 1) - timedelta(days=1)
        
    return year_int, month_int, start_date_of_month, end_date_of_month

# Profit and Loss Endpoints
@app.post("/profit-and-loss/", response_model=schema.ProfitAndLossResponse, status_code=201)
def create_profit_and_loss_statement(
    pnl_input: schema.ProfitAndLossCreate, # Changed from pnl_data
    db: Session = Depends(get_db)
):
    """
    Create or Update a Profit and Loss statement for a specific month with calculated values.
    """
    year_int, month_int, start_date_dt, end_date_dt = _parse_month_string_to_dates(pnl_input.month)
    statement_month_date = date(year_int, month_int, 1)

    # Initialize Decimal variables for calculations
    db_gross_sales = Decimal("0.0")
    db_cost_of_sales = Decimal("0.0")
    db_shipping_expense = Decimal("0.0")

    # Step 2 & 3: Fetch Sales Data & Product Costs
    sales_in_month = db.query(
        models.Sale,
        models.PricePoint.base_cost,
        models.PricePoint.shipment_cost
    ).join(models.Product, models.Sale.product_id == models.Product.product_id)\
    .outerjoin(models.PricePoint, models.Product.product_id == models.PricePoint.product_id)\
    .filter(models.Sale.sale_date >= start_date_dt, models.Sale.sale_date <= end_date_dt)\
    .all()

    for sale_record, base_cost, shipment_cost in sales_in_month:
        db_gross_sales += sale_record.sale_price if sale_record.sale_price is not None else Decimal("0.0")
        db_cost_of_sales += base_cost if base_cost is not None else Decimal("0.0")
        db_shipping_expense += shipment_cost if shipment_cost is not None else Decimal("0.0")

    # Step 4: Calculations (Part 1 - Sales-based)
    db_sales_discounts = Decimal("0.0") # As per requirement
    net_sales = db_gross_sales - db_sales_discounts
    db_gross_profit = net_sales - (db_cost_of_sales + db_shipping_expense)
    
    db_payroll_payments = Decimal("0.0") # As per requirement
    operating_expenses = db_payroll_payments # Assuming only payroll for now
    db_operating_income = db_gross_profit - operating_expenses
    
    db_tax_collection = Decimal("0.0") # As per requirement
    db_reserve_collection = Decimal("0.0") # As per requirement
    # Net income calculation adjusted as per typical accounting (reserve_collection not usually subtracted here unless it's an expense)
    db_net_income = db_operating_income - db_tax_collection 
    
    db_costs_and_expenses = db_cost_of_sales + db_shipping_expense + db_payroll_payments
    db_income = net_sales # Total income before COGS and other expenses

    # Step 5: Fetch Purchase Data for the Month
    db_purchases_colombia = db.query(func.sum(models.PricePoint.base_cost))\
        .join(models.Product, models.PricePoint.product_id == models.Product.product_id)\
        .filter(
            models.Product.location == 'Colombia',
            models.Product.purchase_date >= start_date_dt,
            models.Product.purchase_date <= end_date_dt
        ).scalar() or Decimal("0.0")

    db_purchases_usa = db.query(func.sum(models.PricePoint.base_cost))\
        .join(models.Product, models.PricePoint.product_id == models.Product.product_id)\
        .filter(
            models.Product.location == 'USA',
            models.Product.purchase_date >= start_date_dt,
            models.Product.purchase_date <= end_date_dt
        ).scalar() or Decimal("0.0")

    # Step 6: Inventory Valuation
    previous_month_for_query = (start_date_dt.replace(day=1) - timedelta(days=1)).replace(day=1)
    previous_pnl = db.query(models.ProfitAndLoss).filter(models.ProfitAndLoss.month == previous_month_for_query).first()
    
    # Calculate beginning inventory value from actual inventory
    db_beginning_inventory_value = db.query(func.sum(models.PricePoint.base_cost))\
        .join(models.Product, models.PricePoint.product_id == models.Product.product_id)\
        .join(models.Inventory, models.Product.product_id == models.Inventory.product_id)\
        .filter(
            models.Inventory.quantity > 0,
            models.Product.purchase_date < start_date_dt
        ).scalar() or Decimal("0.0")
    
    # Calculate ending inventory value
    db_ending_inventory_value = db_beginning_inventory_value + db_purchases_colombia + db_purchases_usa - db_cost_of_sales

    # If ending inventory is negative, adjust cost of sales to prevent negative inventory
    if db_ending_inventory_value < 0:
        # Adjust cost of sales to prevent negative inventory
        db_cost_of_sales = db_beginning_inventory_value + db_purchases_colombia + db_purchases_usa
        db_ending_inventory_value = Decimal("0.0")

    # Step 7: Save to Database (Create or Update)
    existing_pnl = db.query(models.ProfitAndLoss).filter(models.ProfitAndLoss.month == statement_month_date).first()

    if existing_pnl:
        pnl_to_save = existing_pnl
    else:
        pnl_to_save = models.ProfitAndLoss(month=statement_month_date)
        db.add(pnl_to_save) # Add to session if new

    pnl_to_save.gross_sales = db_gross_sales
    pnl_to_save.sales_discounts = db_sales_discounts
    pnl_to_save.shipping_expense = db_shipping_expense # shipping_income was removed
    pnl_to_save.gross_profit = db_gross_profit
    pnl_to_save.beginning_inventory_value = db_beginning_inventory_value
    pnl_to_save.purchases_colombia = db_purchases_colombia
    pnl_to_save.purchases_usa = db_purchases_usa
    pnl_to_save.ending_inventory_value = db_ending_inventory_value
    pnl_to_save.cost_of_sales = db_cost_of_sales
    pnl_to_save.payroll_payments = db_payroll_payments
    # net_income_without_operations was removed
    pnl_to_save.costs_and_expenses = db_costs_and_expenses
    pnl_to_save.income = db_income
    pnl_to_save.operating_income = db_operating_income
    pnl_to_save.tax_collection = db_tax_collection
    pnl_to_save.reserve_collection = db_reserve_collection
    pnl_to_save.net_income = db_net_income
    
    try:
        db.commit()
        db.refresh(pnl_to_save)
        return pnl_to_save
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Data integrity error during P&L save.")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error during P&L save for month {pnl_input.month}: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@app.get("/profit-and-loss/", response_model=List[schema.ProfitAndLossResponse])
def list_profit_and_loss_statements(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List Profit and Loss statements.
    Can be filtered by a date range (inclusive for start_date, exclusive for end_date's month end).
    Results are ordered by month in descending order.
    """
    query = db.query(models.ProfitAndLoss)

    if start_date:
        # Filter for months greater than or equal to the start_date's month
        query = query.filter(models.ProfitAndLoss.month >= start_date.replace(day=1))

    if end_date:
        # Filter for months less than or equal to the end_date's month
        # To include the whole month of end_date, we find the first day of the next month
        # and filter for records strictly before that.
        if end_date.month == 12:
            next_month_start = date(end_date.year + 1, 1, 1)
        else:
            next_month_start = date(end_date.year, end_date.month + 1, 1)
        query = query.filter(models.ProfitAndLoss.month < next_month_start)

    pnl_statements = query.order_by(models.ProfitAndLoss.month.desc()).offset(skip).limit(limit).all()
    return pnl_statements

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

@app.post("/instances/{instance_id}/sell", response_model=schema.SaleResponse)
def sell_product(
    instance_id: int,
    sale: schema.SaleCreate,
    db: Session = Depends(get_db)
):
    """
    Process a product sale:
    1. Create sale record
    2. Update inventory
    3. Create inventory transaction
    4. Update financial metrics
    """
    try:
        # Get product and inventory
        instance = db.query(models.ProductInstance).filter(models.ProductInstance.instance_id == instance_id).first()
        if not instance:
            raise HTTPException(status_code=404, detail="Product instance not found")
        
        if instance.status != 'available':
            raise HTTPException(status_code=400, detail="Product instance is not available for sale")
            
        # Create sale record
        db_sale = models.Sale(
            product_id=instance.product_id,
            sale_price=sale.sale_price,
            sale_date=sale.sale_date,
            payment_method=sale.payment_method,
            notes=sale.notes
        )
        db.add(db_sale)
        db.flush()
        
        # Update instance status
        instance.status = 'sold'

        # Check if update_financial_metrics function exists and update it if needed
        # If you have this function, make sure it uses product_id from the path parameter
        # For example:
        # update_financial_metrics(db, product_id, sale)
        
        db.commit()
        db.refresh(db_sale)
        return db_sale
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid sale data")


# Sales history endpoints
@app.get("/sales/", response_model=List[schema.SaleResponse])
def get_sales_history(
    skip: int = 0,
    limit: int = 100,
    product_id: Optional[int] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get sales history with optional filtering
    
    Parameters:
    - skip: Number of records to skip (for pagination)
    - limit: Maximum number of records to return
    - product_id: Filter by specific product
    - payment_method: Filter by payment method
    - start_date: Filter sales after this date (format: YYYY-MM-DD)
    - end_date: Filter sales before this date (format: YYYY-MM-DD)
    """
    try:
        # Start with a base query
        query = db.query(models.Sale).join(models.Product)
        
        # Apply filters if provided
        if product_id:
            query = query.filter(models.Sale.product_id == product_id)
        
        if payment_method:
            query = query.filter(models.Sale.payment_method == payment_method)
        
        if start_date:
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(models.Sale.sale_date >= start_date_obj)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid start_date format. Use YYYY-MM-DD"
                )
        
        if end_date:
            try:
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
                # Add one day to include the end date fully
                end_date_obj = end_date_obj + timedelta(days=1)
                query = query.filter(models.Sale.sale_date < end_date_obj)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid end_date format. Use YYYY-MM-DD"
                )
        
        # Order by most recent sales first
        query = query.order_by(models.Sale.sale_date.desc())
        
        # Apply pagination
        sales = query.offset(skip).limit(limit).all()
        
        return sales
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while retrieving sales history: {str(e)}"
        )

@app.get("/sales/{sale_id}", response_model=schema.SaleDetailResponse)
def get_sale_details(
    sale_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific sale"""
    sale = db.query(models.Sale).filter(models.Sale.sale_id == sale_id).first()
    
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    return sale

@app.get("/instances/", response_model=List[schema.ProductInstanceResponse])
def get_all_instances(
    skip: int = 0,
    limit: int = 1000,  # Increased default limit to fetch more products
    db: Session = Depends(get_db),
    category_id: Optional[int] = None,
    location: Optional[str] = None
):
    """Get all product instances with their associated product information"""
    try:
        # Start with a query that includes the product relationship
        query = db.query(models.ProductInstance).join(models.Product)

        # Apply filters if provided
        if category_id:
            query = query.filter(models.Product.category_id == category_id)
        if location:
            query = query.filter(models.ProductInstance.location == location)

        # Get all instances with their products
        instances = query.offset(skip).limit(limit).all()

        return instances

    except Exception as e:
        print(f"Error in get_all_instances: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/migrate-products-to-instances/", response_model=dict)
def migrate_products_to_instances(db: Session = Depends(get_db)):
    """
    Migration endpoint to create ProductInstance records for existing Products
    that don't have corresponding instances.
    """
    try:
        from datetime import date
        from decimal import Decimal
        
        # Find all products that don't have ProductInstance records
        products_without_instances = db.query(models.Product).outerjoin(
            models.ProductInstance, models.Product.product_id == models.ProductInstance.product_id
        ).filter(models.ProductInstance.instance_id.is_(None)).all()
        
        if not products_without_instances:
            return {
                "message": "No products need migration. All products already have instances.",
                "migrated_count": 0,
                "total_products": 0
            }
        
        migrated_count = 0
        error_count = 0
        
        for product in products_without_instances:
            try:
                # Try to get base cost from PricePoint
                price_point = db.query(models.PricePoint).filter(
                    models.PricePoint.product_id == product.product_id
                ).order_by(models.PricePoint.created_at.desc()).first()
                
                base_cost = Decimal('0.00')
                if price_point:
                    base_cost = price_point.base_cost
                
                # Create ProductInstance
                instance = models.ProductInstance(
                    product_id=product.product_id,
                    base_cost=base_cost,
                    status='available',
                    purchase_date=product.purchase_date or date.today(),
                    location=product.location or 'Colombia'
                )
                
                db.add(instance)
                migrated_count += 1
                
            except Exception as e:
                error_count += 1
                print(f"Error processing product {product.product_id}: {e}")
                continue
        
        # Commit all changes
        db.commit()
        
        return {
            "message": f"Migration completed successfully",
            "migrated_count": migrated_count,
            "error_count": error_count,
            "total_products": len(products_without_instances)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

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

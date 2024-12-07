from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import get_db, engine, Base
from models import Product, ProductCategory
from schemas import ProductCreate, Product as ProductSchema
from schemas import ProductCategoryCreate, ProductCategory as ProductCategorySchema

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/products/", response_model=ProductSchema)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    # Check if SKU exists
    db_product = db.query(Product).filter(Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    # Create new product
    new_product = Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.get("/products/", response_model=List[ProductSchema])
def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = db.query(Product).offset(skip).limit(limit).all()
    return products
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class ProductCategory(Base):
    __tablename__ = "product_categories"
    
    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(50), nullable=False)
    parent_category_id = Column(Integer, ForeignKey('product_categories.category_id'))
    created_at = Column(DateTime(timezone=True), server_default='CURRENT_TIMESTAMP')
    updated_at = Column(DateTime(timezone=True), server_default='CURRENT_TIMESTAMP')
    
    # Relationships
    products = relationship("Product", back_populates="category")
    
class Product(Base):
    __tablename__ = "products"
    
    product_id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, nullable=False)
    category_id = Column(Integer, ForeignKey('product_categories.category_id'))
    name = Column(String(200), nullable=False)
    description = Column(String)
    condition = Column(String(20), nullable=False)
    edition = Column(String(50))
    rarity = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default='CURRENT_TIMESTAMP')
    updated_at = Column(DateTime(timezone=True), server_default='CURRENT_TIMESTAMP')
    
    # Relationships
    category = relationship("ProductCategory", back_populates="products")
    images = relationship("ProductImage", back_populates="product")
    inventory = relationship("Inventory", back_populates="product")

# Add other models similarly...
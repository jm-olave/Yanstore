from pydantic import BaseModel, constr, EmailStr, condecimal, conint, Field
from typing import Optional, List, Union
from datetime import datetime, date
from decimal import Decimal

# Base Schemas 

class CategoryBase(BaseModel):
    """Base schema for product category data that's common to all operations"""
    category_name: str = Field(..., min_length=1, max_length=50)
    parent_category_id: Optional[int] = None

class ProductBase(BaseModel):
    """Base schema for product data that's common to all operations"""
    name: str = Field(..., min_length=1, max_length=200)
    sku: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = None
    condition: str = Field(..., pattern='^(new|used|refurbished)$')
    edition: Optional[str] = None
    rarity: Optional[str] = None
    set_name: Optional[str] = None
    set_code: Optional[str] = None
    language: Optional[str] = None

# Now let's create schemas for creating new records

class CategoryCreate(CategoryBase):
    """Schema for creating a new category"""
    pass

class ProductCreate(ProductBase):
    """Schema for creating a new product"""
    category_id: int

class ProductImageCreate(BaseModel):
    """Schema for creating a product image"""
    image_url: str
    is_primary: bool = False

class InventoryCreate(BaseModel):
    """Schema for creating inventory records"""
    product_id: int
    quantity: int = Field(..., ge=0)  # Must be greater than or equal to 0
    reorder_point: int = Field(0, ge=0)

class PricePointCreate(BaseModel):
    """Schema for creating price points"""
    product_id: int
    base_cost: Decimal = Field(..., ge=0, decimal_places=2)
    selling_price: Decimal = Field(..., ge=0, decimal_places=2)
    market_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    currency: str = Field(..., pattern='^[A-Z]{3}$')

# Now schemas for responses

class CategoryResponse(CategoryBase):
    """Schema for category responses including database-generated fields"""
    category_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        form_attributes = True

class ProductResponse(ProductBase):
    """Schema for product responses including all related data"""
    product_id: int
    category_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    set_name: Optional[str] = None
    set_code: Optional[str] = None
    language: Optional[str] = None
    # Optional nested responses
    category: Optional[CategoryResponse] = None
    current_price: Optional[float] = None
    available_quantity: Optional[int] = None

    class Config:
        form_attributes = True

class InventoryResponse(BaseModel):
    """Schema for inventory responses"""
    inventory_id: int
    product_id: int
    quantity: int
    available_quantity: int
    reserved_quantity: int
    reorder_point: int
    last_restock_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        form_attributes = True

class PriceHistoryResponse(BaseModel):
    """Schema for price history responses"""
    history_id: int
    product_id: int
    old_price: Decimal
    new_price: Decimal
    change_date: datetime
    change_reason: Optional[str]
    changed_by: str

    class Config:
       form_attribute = True

# Schemas for updates

class ProductUpdate(BaseModel):
    """Schema for updating product information"""
    name: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    is_active: Optional[bool] = None
    category_id: Optional[int] = None

    class Config:
        form_attributes = True

class InventoryUpdate(BaseModel):
    """Schema for updating inventory levels"""
    quantity: Optional[int] = None
    reorder_point: Optional[int] = None

    class Config:
        form_attributes = True

# Schemas for specialized operations

class InventoryTransaction(BaseModel):
    """Schema for recording inventory transactions"""
    inventory_id: int
    transaction_type: str = Field(..., pattern='^(restock|sale|adjustment|return|reserve|release)$')
    quantity: int = Field(..., ne=0)   # Cannot be zero
    reference_id: Optional[str]
    notes: Optional[str]
    created_by: str

class OrderCreate(BaseModel):
    """Schema for creating orders"""
    products: List[dict]  # List of product IDs and quantities
    shipping_address: str
    notes: Optional[str]

class OrderResponse(BaseModel):
    """Schema for order responses"""
    order_id: int
    order_number: str
    status: str
    subtotal: Decimal
    shipping_cost: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    created_at: datetime

    class Config:
        form_attributes = True

# Search and filter schemas

class ProductFilter(BaseModel):
    """Schema for filtering products in search operations"""
    category_id: Optional[int]
    condition: Optional[str]
    min_price: Optional[float]
    max_price: Optional[float]
    is_active: Optional[bool]
    rarity: Optional[str]

class ProductSort(BaseModel):
    """Schema for sorting product results"""
    sort_by: str = 'created_at'
    order: str = 'desc'


# schemas for supplier 
class SupplierBase(BaseModel):
    """Base schema for supplier data"""
    name: str = Field(..., min_length=1, max_length=100)
    debtor_type: str = Field(..., pattern='^(regular|preferred|premium)$')
    contact_person: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    payment_terms: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[float] = Field(None, ge=0)

class SupplierCreate(SupplierBase):
    """Schema for creating a new supplier"""
    pass

class SupplierUpdate(BaseModel):
    """Schema for updating supplier information"""
    name: Optional[str] = Field(None, max_length=100)
    debtor_type: Optional[str] = Field(None, pattern='^(regular|preferred|premium)$')
    contact_person: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    payment_terms: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None

class SupplierResponse(SupplierBase):
    """Schema for supplier responses"""
    supplier_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
from pydantic import BaseModel, constr, EmailStr, condecimal, conint, Field, validator
from typing import Optional, List, Union
from datetime import datetime, date
from decimal import Decimal

# Base Schemas 

class CategoryBase(BaseModel):
    """Base schema for product category data that's common to all operations"""
    category_name: str = Field(..., min_length=1, max_length=50)
    parent_category_id: Optional[int] = None

# First, let's define a constant for the condition pattern
VALID_CONDITIONS = "^(Mint|Near Mint|Excellent|Good|Lightly Played|Played|Poor|New|Used|Damaged)$"

class ProductBase(BaseModel):
    """Base schema for product data that's common to all operations"""
    name: str = Field(..., min_length=1, max_length=200)
    sku: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = None
    condition: str = Field(..., pattern=VALID_CONDITIONS)
    location: Optional[str] = Field(None, max_length=100)
    purchase_date: Union[str, date]
    obtained_method: str = Field(..., min_length=1, max_length=50)

    @validator('purchase_date')
    def parse_date(cls, v):
        if isinstance(v, date):
            return v
        try:
            return datetime.strptime(v, "%Y-%m-%d").date()
        except ValueError:
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00')).date()
            except ValueError:
                raise ValueError('Invalid date format. Use YYYY-MM-DD')
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

# schema for sales and financialInformation 
# Add these to your schema.py file

class PricePointBase(BaseModel):
    """Base schema for price point data"""
    product_id: int
    base_cost: Decimal = Field(..., ge=0)  # Changed from gt=0 to ge=0
    selling_price: Decimal = Field(..., gt=0)  # Keep this greater than 0
    market_price: Optional[Decimal] = Field(None, ge=0)
    shipment_cost: Decimal = Field(0.00, ge=0)  # Already correct
    currency: str = Field(..., pattern='^[A-Z]{3}$')
    effective_from: Optional[datetime] = None


class PricePointCreate(PricePointBase):
    """Schema for creating a new price point"""
    pass

class PricePointResponse(PricePointBase):
    """Schema for price point responses"""
    price_point_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    """Base schema for sale data"""
    product_id: int
    sale_price: Decimal = Field(..., ge=0)
    sale_date: datetime
    payment_method: str = Field(..., pattern='^(Credit|Cash|USD|Trade)$')
    notes: Optional[str] = None

class SaleCreate(SaleBase):
    """Schema for creating a new sale"""
    pass

class SaleResponse(SaleBase):
    """Schema for sale responses"""
    sale_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FinancialMetricBase(BaseModel):
    """Base schema for financial metrics"""
    record_date: date
    dollar_average: Decimal
    efficiency_over_costs: Decimal
    efficiency_over_goal: Decimal
    estimated_revenue: Decimal
    actual_revenue: Decimal
    total_net_income: Decimal
    tax_rate: Decimal
    reserve_rate: Decimal
    profit_margin: Decimal

class FinancialMetricCreate(FinancialMetricBase):
    """Schema for creating financial metrics"""
    pass

class FinancialMetricResponse(FinancialMetricBase):
    """Schema for financial metric responses"""
    metric_id: int
    created_at: datetime

    class Config:
        from_attributes = True
# Now schemas for responses

class CategoryResponse(CategoryBase):
    """Schema for category responses including database-generated fields"""
    category_id: int
    created_at: datetime
    updated_at: datetime

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

    class Config:
        orm_mode = True

class ProductResponse(ProductBase):
    """Schema for product responses including rentability metrics"""
    product_id: int
    category_id: Optional[int]
    condition: str = Field(..., pattern=VALID_CONDITIONS)
    is_active: bool
    created_at: datetime
    updated_at: datetime
    rentability_percentage: float = 0
    average_profit: float = 0
    total_revenue: float = 0
    total_cost: float = 0
    total_profit: float = 0
    sales_count: int = 0
    inventory: Optional[InventoryResponse] = None

    class Config:
        orm_mode = True

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

# Schema for InventoryTransaction 
class InventoryTransactionBase(BaseModel):
    """Base schema for inventory transactions"""
    inventory_id: int
    transaction_type: str
    quantity: int
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    created_by: str

class InventoryTransactionResponse(InventoryTransactionBase):
    """Schema for inventory transaction responses"""
    transaction_id: int
    transaction_date: datetime

    class Config:
        from_attributes = True







# Schemas for updates

class ProductUpdate(BaseModel):
    """Schema for updating product information"""
    name: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    is_active: Optional[bool] = None
    category_id: Optional[int] = None
    obtained_method: Optional[str] = None
    location: Optional[str] = Field(None, max_length=100)

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
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)

class SupplierCreate(SupplierBase):
    """Schema for creating a new supplier"""
    pass

class SupplierUpdate(BaseModel):
    """Schema for updating supplier information"""
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None

class SupplierResponse(SupplierBase):
    """Schema for supplier responses"""
    supplier_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DeleteResponse(BaseModel):
    """Schema for delete operation responses"""
    success: bool
    message: str
    product_id: Optional[int] = None

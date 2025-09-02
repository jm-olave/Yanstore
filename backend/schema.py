from pydantic import BaseModel, constr, EmailStr, condecimal, conint, Field, validator
from typing import Optional, List, Union
from datetime import datetime, date
from decimal import Decimal

# Event Schemas
class EventBase(BaseModel):
    """Base schema for event data"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    country: str = Field(..., min_length=1, max_length=100)
    start_date: date
    end_date: date
    initial_budget: Decimal = Field(..., ge=0)

    @validator('end_date')
    def validate_date_range(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v

class EventCreate(EventBase):
    """Schema for creating a new event"""
    pass

class EventUpdate(BaseModel):
    """Schema for updating event information"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    initial_budget: Optional[Decimal] = Field(None, ge=0)

class EventResponse(BaseModel):
    """Schema for event responses"""
    event_id: int
    name: str
    description: Optional[str] = None
    country: str
    start_date: date
    end_date: date
    initial_budget: Decimal
    end_budget: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Travel Expense Schemas
class TravelExpenseBase(BaseModel):
    """Base schema for travel expense data"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    amount: Decimal = Field(..., ge=0)
    expense_date: date

class TravelExpenseCreate(TravelExpenseBase):
    """Schema for creating new travel expenses"""
    event_id: int

class TravelExpenseUpdate(BaseModel):
    """Schema for updating travel expense information"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    expense_date: Optional[date] = None

class TravelExpenseResponse(TravelExpenseBase):
    """Schema for travel expense responses"""
    expense_id: int
    event_id: int
    receipt_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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
    event_id: Optional[int] = None

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

# Schemas for Profit and Loss
class ProfitAndLossBase(BaseModel):
    month: date # This remains date as it's the type in the DB model and response
    gross_sales: Decimal = Field(default=0.00, ge=0)
    sales_discounts: Decimal = Field(default=0.00, ge=0)
    shipping_expense: Decimal = Field(default=0.00, ge=0)
    gross_profit: Decimal = Field(default=0.00) # Can be negative
    beginning_inventory_value: Decimal = Field(default=0.00, ge=0)
    purchases_colombia: Decimal = Field(default=0.00, ge=0)
    purchases_usa: Decimal = Field(default=0.00, ge=0)
    ending_inventory_value: Decimal = Field(default=0.00) # Allow negative for now
    cost_of_sales: Decimal = Field(default=0.00, ge=0)
    payroll_payments: Decimal = Field(default=0.00, ge=0)
    costs_and_expenses: Decimal = Field(default=0.00, ge=0)
    income: Decimal = Field(default=0.00, ge=0)
    operating_income: Decimal = Field(default=0.00) # Can be negative
    tax_collection: Decimal = Field(default=0.00, ge=0)
    reserve_collection: Decimal = Field(default=0.00, ge=0)
    net_income: Decimal = Field(default=0.00) # Can be negative

class ProfitAndLossCreate(BaseModel): # No longer inherits from ProfitAndLossBase
    month: str # Expects "YYYY-MM" format as per new requirement

    @validator('month')
    def validate_month_format(cls, value):
        try:
            datetime.strptime(value, "%Y-%m")
            return value
        except ValueError:
            raise ValueError("Month must be in YYYY-MM format")

class ProfitAndLossResponse(ProfitAndLossBase):
    pnl_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SaleBase(BaseModel):
    """Base schema for sale data"""
    sale_price: Decimal = Field(..., ge=0)
    sale_date: datetime
    payment_method: str = Field(..., pattern='^(Credit|Cash|USD|Trade)$')
    notes: Optional[str] = None

class SaleCreate(SaleBase):
    """Schema for creating a new sale"""
    # product_id is not needed here as it comes from the URL path
    pass

class SaleResponse(SaleBase):
    """Schema for sale responses"""
    sale_id: int
    product_id: int
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

class ProductBulkUpdateLocationRequest(BaseModel):
    """Schema for bulk updating product locations"""
    product_ids: List[int]
    new_location: str = Field(..., min_length=1)

class InstanceBulkUpdateLocationRequest(BaseModel):
    """Schema for bulk updating instance locations"""
    instance_ids: List[int]
    new_location: str = Field(..., min_length=1)

class ProductInstanceBase(BaseModel):
    """Base schema for product instance data"""
    product_id: int
    base_cost: Decimal = Field(..., ge=0)
    status: str = Field(default='available', pattern='^(available|sold|reserved)$')
    purchase_date: Optional[date] = None
    location: Optional[str] = Field(None, max_length=100)
    condition: str = Field(..., pattern=VALID_CONDITIONS)

class ProductInstanceCreate(ProductInstanceBase):
    """Schema for creating a new product instance"""
    pass

class ProductInstanceUpdate(BaseModel):
    """Schema for updating a product instance"""
    base_cost: Optional[Decimal] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern='^(available|sold|reserved)$')
    location: Optional[str] = Field(None, max_length=100)
    condition: Optional[str] = Field(None, pattern=VALID_CONDITIONS)

class ProductInstanceResponse(BaseModel):
    """Schema for product instance responses"""
    instance_id: int
    product_id: int
    base_cost: Decimal
    status: str
    purchase_date: Optional[date] = None
    location: Optional[str] = None
    condition: Optional[str] = None  # Make this optional
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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
    event_id: Optional[int]
    condition: str = Field(..., pattern=VALID_CONDITIONS)
    obtained_method: Optional[str] = Field(None, max_length=50)  # Override to allow None/empty
    is_active: bool
    created_at: datetime
    updated_at: datetime
    rentability_percentage: float = 0
    average_profit: float = 0
    total_revenue: float = 0
    total_cost: float = 0
    total_profit: float = 0
    sales_count: int = 0

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



class SaleDetailResponse(SaleResponse):
    """Schema for detailed sale responses including product information"""
    product: ProductResponse

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

class ProductInstanceWithProductResponse(BaseModel):
    """Schema for product instance responses with product details"""
    instance_id: int
    product_id: int
    base_cost: Decimal
    status: str
    purchase_date: Optional[date] = None
    location: Optional[str] = None
    condition: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Include product details - make sure this matches your ProductResponse
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True



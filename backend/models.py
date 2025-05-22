from sqlalchemy import Column, Integer, String, DateTime, Boolean, Numeric, ForeignKey, Date, Text, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class ProductCategory(Base):
    __tablename__ = "product_categories"
    
    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(50), nullable=False)
    parent_category_id = Column(Integer, ForeignKey('product_categories.category_id'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationshipsx
    products = relationship("Product", back_populates="category")
    
class Product(Base):
    __tablename__ = "products"
    
    product_id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, nullable=False)
    category_id = Column(Integer, ForeignKey('product_categories.category_id'))
    name = Column(String(200), nullable=False)
    description = Column(String)
    location = Column(String(100))
    condition = Column(String(20), nullable=False) 
    is_active = Column(Boolean, default=True)
    purchase_date = Column(Date)  # Changed from DateTime to Date
    obtained_method = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    category = relationship("ProductCategory", back_populates="products")
    images = relationship("ProductImage", back_populates="product")
    inventory = relationship("Inventory", back_populates="product", uselist=False, lazy='joined')
    price_points = relationship("PricePoint", back_populates="product")
    price_history = relationship("PriceHistory", back_populates="product")
    supplier_products = relationship("SupplierProduct", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")

    def calculate_rentability(self, db_session) -> dict:
        """Calculate various rentability metrics for the product"""
        # Get latest price point
        latest_price = (db_session.query(PricePoint)
            .filter(PricePoint.product_id == self.product_id)
            .order_by(PricePoint.effective_from.desc())
            .first())
            
        # Get all sales for this product
        sales = (db_session.query(Sale)
            .filter(Sale.product_id == self.product_id)
            .all())
            
        if not latest_price:
            return {
                "rentability_percentage": 0,
                "average_profit": 0,
                "total_revenue": 0,
                "total_cost": 0,
                "total_profit": 0,
                "sales_count": 0
            }

        # Calculate metrics
        total_revenue = sum(float(sale.sale_price) for sale in sales)
        total_cost = float(latest_price.base_cost + latest_price.shipment_cost)
        sales_count = len(sales)
        
        # Avoid division by zero
        if sales_count == 0 or total_cost == 0:
            return {
                "rentability_percentage": 0,
                "average_profit": 0,
                "total_revenue": total_revenue,
                "total_cost": total_cost,
                "total_profit": 0,
                "sales_count": 0
            }

        total_profit = total_revenue - (total_cost * sales_count)
        average_profit = total_profit / sales_count
        rentability_percentage = (total_profit / (total_cost * sales_count)) * 100

        return {
            "rentability_percentage": round(rentability_percentage, 2),
            "average_profit": round(average_profit, 2),
            "total_revenue": round(total_revenue, 2),
            "total_cost": round(total_cost, 2),
            "total_profit": round(total_profit, 2),
            "sales_count": sales_count
        }

class ProductImage(Base):
    """
    Stores product images with their relationships to products.
    One product can have multiple images, but only one primary image.
    """
    __tablename__ = "product_images"

    image_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.product_id'), nullable=False)
    image_data = Column(LargeBinary, nullable=False)  # Store the actual image data
    image_type = Column(String(10), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to product
    product = relationship("Product", back_populates="images")

class Inventory(Base):
    """
    Manages product inventory levels including available and reserved quantities.
    Tracks stock levels and reorder points for inventory management.
    """
    __tablename__ = "inventory"

    inventory_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.product_id'), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    available_quantity = Column(Integer, nullable=False, default=0)
    reserved_quantity = Column(Integer, nullable=False, default=0)
    reorder_point = Column(Integer, nullable=False, default=0)
    last_restock_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="inventory")
    transactions = relationship("InventoryTransaction", back_populates="inventory")

class InventoryTransaction(Base):
    """
    Records all inventory movements including restocks, sales, and adjustments.
    Provides audit trail for inventory changes.
    """
    __tablename__ = "inventory_transactions"

    transaction_id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey('inventory.inventory_id'), nullable=False)
    transaction_type = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    reference_id = Column(String(50))
    transaction_date = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    created_by = Column(String(50), nullable=False)

    # Relationship back to inventory
    inventory = relationship("Inventory", back_populates="transactions")

class PricePoint(Base):
    """
    Manages product pricing information including cost, selling price, and market price.
    Supports multiple currencies and tracks price effectiveness periods.
    """
    __tablename__ = "price_points"

    price_point_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.product_id'), nullable=False)
    base_cost = Column(Numeric(10, 2), nullable=False)
    selling_price = Column(Numeric(10, 2), nullable=False)
    market_price = Column(Numeric(10, 2))
    shipment_cost = Column(Numeric(10, 2), default=0.00, nullable=False)
    currency = Column(String(3), default='USD')
    effective_from = Column(DateTime(timezone=True), server_default=func.now())
    effective_to = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to product
    product = relationship("Product", back_populates="price_points")

class PriceHistory(Base):
    """
    Tracks historical price changes for audit and analysis purposes.
    Records who made changes and why.
    """
    __tablename__ = "price_history"

    history_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.product_id'), nullable=False)
    old_price = Column(Numeric(10, 2), nullable=False)
    new_price = Column(Numeric(10, 2), nullable=False)
    change_date = Column(DateTime(timezone=True), server_default=func.now())
    change_reason = Column(String(100))
    changed_by = Column(String(50), nullable=False)

    # Relationship to product
    product = relationship("Product", back_populates="price_history")

class Supplier(Base):
    """
    Manages supplier information and contact details.
    Tracks active status.
    """
    __tablename__ = "suppliers"

    supplier_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    supplier_products = relationship("SupplierProduct", back_populates="supplier")

class SupplierProduct(Base):
    """
    Maps products to suppliers with supplier-specific information.
    Tracks supplier prices, lead times, and preferred supplier status.
    """
    __tablename__ = "supplier_products"

    supplier_product_id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey('suppliers.supplier_id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.product_id'), nullable=False)
    supplier_sku = Column(String(50))
    supplier_price = Column(Numeric(10, 2), nullable=False)
    lead_time_days = Column(Integer)
    minimum_order_quantity = Column(Integer, default=1)
    is_preferred = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    supplier = relationship("Supplier", back_populates="supplier_products")
    product = relationship("Product", back_populates="supplier_products")

class Order(Base):
    """
    Stores order information including totals and status.
    Tracks order lifecycle from creation to completion.
    """
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False)
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    shipping_cost = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default='USD')
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    order_items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    """
    Stores individual line items for each order.
    Tracks quantity and pricing for each product in an order.
    """
    __tablename__ = "order_items"

    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.order_id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.product_id'), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")


class Sale(Base):
    """
    Records individual product sales with pricing and payment information.
    Links to product and maintains sale history.
    """
    __tablename__ = "sales"

    sale_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey('products.product_id'), nullable=False)
    sale_price = Column(Numeric(10, 2), nullable=False)
    sale_date = Column(DateTime(timezone=True), nullable=False)
    payment_method = Column(String(20), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", backref="sales")

class FinancialMetric(Base):
    """
    Tracks financial performance metrics over time.
    Stores revenue, efficiency, and profitability measurements.
    """
    __tablename__ = "financial_metrics"

    metric_id = Column(Integer, primary_key=True, index=True)
    record_date = Column(Date, nullable=False)
    dollar_average = Column(Numeric(10, 2), nullable=False)
    efficiency_over_costs = Column(Numeric(10, 2))
    efficiency_over_goal = Column(Numeric(10, 2))
    estimated_revenue = Column(Numeric(10, 2))
    actual_revenue = Column(Numeric(10, 2))
    total_net_income = Column(Numeric(10, 2))
    tax_rate = Column(Numeric(5, 2))
    reserve_rate = Column(Numeric(5, 2))
    profit_margin = Column(Numeric(5, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ProfitAndLoss(Base):
    __tablename__ = "profit_and_loss"

    pnl_id = Column(Integer, primary_key=True, index=True)
    month = Column(Date, nullable=False)  # Consider unique=True or composite key for one P&L per month
    gross_sales = Column(Numeric(12, 2), nullable=False, default=0.00)
    sales_discounts = Column(Numeric(12, 2), nullable=False, default=0.00)
    shipping_income = Column(Numeric(12, 2), nullable=False, default=0.00) # Income from shipping charged
    shipping_expense = Column(Numeric(12, 2), nullable=False, default=0.00) # Cost of shipping paid
    gross_profit = Column(Numeric(12, 2), nullable=False, default=0.00)
    beginning_inventory_value = Column(Numeric(12, 2), nullable=False, default=0.00)
    purchases_colombia = Column(Numeric(12, 2), nullable=False, default=0.00)
    purchases_usa = Column(Numeric(12, 2), nullable=False, default=0.00)
    ending_inventory_value = Column(Numeric(12, 2), nullable=False, default=0.00)
    cost_of_sales = Column(Numeric(12, 2), nullable=False, default=0.00)
    payroll_payments = Column(Numeric(12, 2), nullable=False, default=0.00)
    net_income_without_operations = Column(Numeric(12, 2), nullable=False, default=0.00)
    costs_and_expenses = Column(Numeric(12, 2), nullable=False, default=0.00) # Potentially aggregate
    income = Column(Numeric(12, 2), nullable=False, default=0.00) # Potentially aggregate
    operating_income = Column(Numeric(12, 2), nullable=False, default=0.00)
    tax_collection = Column(Numeric(12, 2), nullable=False, default=0.00)
    reserve_collection = Column(Numeric(12, 2), nullable=False, default=0.00)
    net_income = Column(Numeric(12, 2), nullable=False, default=0.00)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

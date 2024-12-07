-- First, let's drop existing tables in reverse order of their dependencies
DO $$ 
BEGIN
    -- Drop tables if they exist, in reverse order of dependencies
    DROP TABLE IF EXISTS financial_metrics CASCADE;
    DROP TABLE IF EXISTS order_items CASCADE;
    DROP TABLE IF EXISTS orders CASCADE;
    DROP TABLE IF EXISTS supplier_products CASCADE;
    DROP TABLE IF EXISTS suppliers CASCADE;
    DROP TABLE IF EXISTS price_history CASCADE;
    DROP TABLE IF EXISTS price_points CASCADE;
    DROP TABLE IF EXISTS inventory_transactions CASCADE;
    DROP TABLE IF EXISTS inventory CASCADE;
    DROP TABLE IF EXISTS product_images CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS product_categories CASCADE;
END $$;

-- Now create tables in order of their dependencies

-- Product Categories table - Base table with self-referential relationship
CREATE TABLE product_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    parent_category_id INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Self-referential foreign key
    FOREIGN KEY (parent_category_id) REFERENCES product_categories(category_id) ON DELETE SET NULL
);

-- Products table - Core table with category relationship
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category_id INT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('new', 'used', 'refurbished')),
    edition VARCHAR(50),
    rarity VARCHAR(20),
    set_name VARCHAR(100),
    set_code VARCHAR(20),
    language VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(category_id) ON DELETE SET NULL
);

-- Product Images table - Product media management
CREATE TABLE product_images (
    image_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Inventory table - Stock management
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    available_quantity INT NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    reorder_point INT NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
    last_restock_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    -- Ensure available + reserved = total quantity
    CHECK (available_quantity + reserved_quantity = quantity)
);

-- Inventory Transactions table - Stock movement tracking
CREATE TABLE inventory_transactions (
    transaction_id SERIAL PRIMARY KEY,
    inventory_id INT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (
        transaction_type IN ('restock', 'sale', 'adjustment', 'return', 'reserve', 'release')
    ),
    quantity INT NOT NULL,
    reference_id VARCHAR(50),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_by VARCHAR(50) NOT NULL,
    FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id) ON DELETE CASCADE
);

-- Price Points table - Product pricing management
CREATE TABLE price_points (
    price_point_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    base_cost DECIMAL(10,2) NOT NULL CHECK (base_cost >= 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    market_price DECIMAL(10,2) CHECK (market_price >= 0),
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    -- Ensure effective_to is after effective_from
    CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Price History table - Price change tracking
CREATE TABLE price_history (
    history_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    old_price DECIMAL(10,2) NOT NULL CHECK (old_price >= 0),
    new_price DECIMAL(10,2) NOT NULL CHECK (new_price >= 0),
    change_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    change_reason VARCHAR(100),
    changed_by VARCHAR(50) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Suppliers table - Vendor management
CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100) CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(20),
    payment_terms VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Products table - Supplier-Product relationship
CREATE TABLE supplier_products (
    supplier_product_id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL,
    product_id INT NOT NULL,
    supplier_sku VARCHAR(50),
    supplier_price DECIMAL(10,2) NOT NULL CHECK (supplier_price >= 0),
    lead_time_days INT CHECK (lead_time_days >= 0),
    minimum_order_quantity INT DEFAULT 1 CHECK (minimum_order_quantity > 0),
    is_preferred BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- Orders table - Order management
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL CHECK (
        status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    ),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    shipping_cost DECIMAL(10,2) NOT NULL CHECK (shipping_cost >= 0),
    tax_amount DECIMAL(10,2) NOT NULL CHECK (tax_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure total_amount equals subtotal + shipping_cost + tax_amount
    CHECK (total_amount = subtotal + shipping_cost + tax_amount)
);

-- Order Items table - Order line items
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    -- Ensure subtotal equals quantity * unit_price
    CHECK (subtotal = quantity * unit_price)
);

-- Financial Metrics table - Financial reporting
CREATE TABLE financial_metrics (
    metric_id SERIAL PRIMARY KEY,
    record_date DATE NOT NULL,
    dollar_average DECIMAL(10,2) NOT NULL CHECK (dollar_average >= 0),
    efficiency_over_costs DECIMAL(10,2),
    efficiency_over_goal DECIMAL(10,2),
    estimated_revenue DECIMAL(10,2) CHECK (estimated_revenue >= 0),
    actual_revenue DECIMAL(10,2) CHECK (actual_revenue >= 0),
    total_net_income DECIMAL(10,2),
    tax_rate DECIMAL(5,2) CHECK (tax_rate BETWEEN 0 AND 100),
    reserve_rate DECIMAL(5,2) CHECK (reserve_rate BETWEEN 0 AND 100),
    profit_margin DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

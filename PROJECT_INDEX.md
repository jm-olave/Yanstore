# YanStore - Collectibles Management System

## Project Overview
YanStore is a FastAPI-based backend system for managing collectible items inventory, with a focus on trading cards and similar collectibles. The system includes both a backend API and a React frontend with a complete UI.

## Technology Stack
- **Backend Framework**: FastAPI (Python)
- **Frontend Framework**: React with Vite
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Data Validation**: Pydantic
- **Styling**: Tailwind CSS

## Project Structure

```
yanstore/
├── backend/                 # Backend API (FastAPI)
│   ├── main.py             # Main application and endpoints
│   ├── models.py           # SQLAlchemy models
│   ├── schema.py           # Pydantic models for request/response
│   ├── database.py         # Database configuration
│   ├── requirements.txt    # Python dependencies
│   └── migrations/         # Database migrations
├── frontend/               # Frontend application (React)
│   ├── src/                # Source code
│   │   ├── Pages/          # Page components
│   │   ├── Components/     # Reusable UI components
│   │   ├── Layouts/        # Layout components
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
├── requirements.txt        # Backend dependencies
├── package.json            # Root package.json for deployment
└── README.md              # Project documentation
```

## Backend API Structure

### Main Components
1. **Events Management**
   - Create, list, update, and delete events
   - Calculate event budgets based on expenses
   - Associate products with events

2. **Travel Expenses**
   - Track expenses for events
   - Upload and manage receipts
   - Associate with specific events

3. **Product Management**
   - Create, read, update, delete products
   - Categorize products
   - Track product conditions and locations
   - Manage product instances

4. **Inventory Management**
   - Track stock levels
   - Monitor available and reserved quantities
   - Record inventory transactions

5. **Price Management**
   - Set and update product prices
   - Track price history
   - Support multiple currencies

6. **Sales Management**
   - Record product sales
   - Track payment methods
   - Maintain sales history

7. **Financial Reporting**
   - Profit and Loss statements
   - Financial metrics tracking
   - Exchange rate integration

8. **Supplier Management**
   - Manage supplier information
   - Track supplier relationships with products

### Key Models
- Event: Manages events where products are collected
- TravelExpense: Tracks expenses for events
- ProductCategory: Categorizes products
- Product: Main product entity
- ProductInstance: Individual instances of products
- Inventory: Manages stock levels
- PricePoint: Product pricing information
- Sale: Records product sales
- Supplier: Supplier information

## Frontend Structure

### Pages
1. **Main Menu** - Dashboard/home page
2. **Product Management**
   - Add Product
   - Edit Product
3. **Inventory** - View and manage inventory
4. **Sales History** - View sales records
5. **Categories** - Manage product categories
6. **Suppliers** - Manage supplier information
7. **Statistics** - View analytics and reports
8. **Profit & Loss** - Financial reporting
9. **Events** - Event management

### Components
- Form components (TextInput, SelectInput, etc.)
- UI components (Buttons, Cards, Modals)
- Specialized components (ProductCard, Table components)

### Key Features
- Responsive design using Tailwind CSS
- React Router for navigation
- Custom hooks for API integration
- Environment variable validation

## API Endpoints

### Events
- `POST /events/` - Create a new event
- `GET /events/` - List all events
- `GET /events/{event_id}` - Get a specific event
- `PATCH /events/{event_id}` - Update an event
- `DELETE /events/{event_id}` - Delete an event

### Travel Expenses
- `POST /travel-expenses/` - Create a new travel expense
- `GET /events/{event_id}/travel-expenses` - Get all travel expenses for an event
- `GET /travel-expenses/{expense_id}` - Get a specific travel expense
- `PATCH /travel-expenses/{expense_id}` - Update a travel expense
- `DELETE /travel-expenses/{expense_id}` - Delete a travel expense

### Categories
- `POST /categories/` - Create a new category
- `GET /categories/` - List all categories
- `DELETE /categories/{category_id}` - Delete a category

### Products
- `POST /products/` - Create a new product
- `GET /products/` - List products with optional filtering
- `GET /products/{product_id}` - Get a specific product
- `PATCH /products/{product_id}` - Update a product
- `DELETE /products/{product_id}` - Delete a product

### Product Instances
- `POST /instances/create/` - Create a new product instance
- `GET /instances/` - Get all product instances
- `POST /instances/{instance_id}/sell` - Sell a product instance

### Inventory
- `GET /inventory/{product_id}` - Get inventory status for a product
- `GET /inventory-transactions/{inventory_id}` - Get transaction history

### Price Points
- `POST /price-points/` - Create a new price point
- `GET /products/{product_id}/price-points/` - Get price points for a product

### Sales
- `GET /sales/` - Get sales history with filtering
- `GET /sales/{sale_id}` - Get detailed sale information

### Financial Information
- `POST /profit-and-loss/` - Create/update profit and loss statement
- `GET /profit-and-loss/` - List profit and loss statements
- `GET /exchange-rates/` - Get current exchange rates

### Suppliers
- `POST /suppliers/` - Create a new supplier
- `GET /suppliers/` - List suppliers
- `GET /suppliers/{supplier_id}` - Get a specific supplier
- `PATCH /suppliers/{supplier_id}` - Update a supplier
- `DELETE /suppliers/{supplier_id}` - Delete/deactivate a supplier

## Database Schema
The system uses PostgreSQL with a comprehensive schema including:
- Events and travel expenses tracking
- Product categories and products with detailed attributes
- Product instances for individual item tracking
- Inventory management with transaction history
- Pricing information with historical tracking
- Sales records with payment details
- Supplier information and relationships
- Financial reporting tables

## Deployment
The application is configured for deployment with:
- Heroku deployment configuration
- Environment variable management
- Separate configurations for development and production
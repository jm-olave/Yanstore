# YanStore - Collectibles Management System

A FastAPI-based backend system for managing collectible items inventory, with a focus on trading cards and similar collectibles.

## Technology Stack

- **Backend Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Data Validation**: Pydantic
- **Python Version**: 3.8+

## Prerequisites

Before running the project, make sure you have:

1. Python 3.8 or higher installed
2. PostgreSQL installed and running
3. pip (Python package manager)

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd yanstore
```

2. Create and activate a virtual environment:
```bash
# Windows
python -m venv yanstore
.\yanstore\Scripts\activate

# Unix/MacOS
python -m venv yanstore
source yanstore/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the project root with your database configuration:
```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=productdb
```

## Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE productdb;
```

2. The tables will be automatically created when you start the application for the first time.

## Running the Application

Start the FastAPI server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Swagger UI documentation: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## Main Features

### Product Management
- Create, read, update products
- Categorize products
- Track product conditions and rarity
- Manage product sets and editions

### Inventory Management
- Track stock levels
- Monitor available and reserved quantities
- Record inventory transactions

### Price Management
- Set and update product prices
- Track price history
- Support multiple currencies

## Project Structure

```
yanstore/
├── main.py           # FastAPI application and endpoints
├── models.py         # SQLAlchemy models
├── schema.py         # Pydantic models for request/response
├── database.py       # Database configuration
└── requirements.txt  # Project dependencies
```

## API Endpoints

### Categories
- `POST /categories/`: Create a new category
- `GET /categories/`: List all categories

### Products
- `POST /products/`: Create a new product
- `GET /products/`: List products with optional filtering
- `GET /products/{product_id}`: Get a specific product
- `PATCH /products/{product_id}`: Update a product

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request




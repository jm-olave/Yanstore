import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# Assuming your FastAPI app and models are structured as follows:
# Adjust paths if your project structure is different.
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app, get_db # main.py is in the parent directory (backend/)
from models import Base, Product, ProductCategory, Inventory # models.py is in the parent directory
from schema import ProductBulkUpdateLocationRequest # schema.py is in the parent directory
from database import engine as main_engine # To get the original engine for creating test URL

# Use a separate SQLite database for testing
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency for testing
def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Create a default category for products if necessary
        default_category = db.query(ProductCategory).filter(ProductCategory.category_name == "Default Category").first()
        if not default_category:
            default_category = ProductCategory(category_name="Default Category")
            db.add(default_category)
            db.commit()
            db.refresh(default_category)

        # Store it on the session or a context to access in tests if needed, or pass to helpers
        db.default_category_id = default_category.category_id

        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session: Session) -> TestClient: # client fixture now depends on db_session
    return TestClient(app)

# Helper function to create a product
def create_test_product(db: Session, name: str, sku: str, initial_location: str, category_id: int):
    product = Product(
        name=name,
        sku=sku,
        category_id=category_id, # Use the default category
        description="Test Description",
        condition="New",
        purchase_date="2023-01-01",
        location=initial_location,
        obtained_method="Purchased"
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    inventory = Inventory(
        product_id=product.product_id,
        quantity=10,
        available_quantity=10,
        reorder_point=5
    )
    db.add(inventory)
    db.commit()
    db.refresh(inventory)
    product.inventory = inventory # Associate inventory for direct access if needed
    return product

# --- Test Cases ---

def test_bulk_update_location_success(client: TestClient, db_session: Session):
    # Create products
    product1 = create_test_product(db_session, "Product A", "SKU001", "Location X", db_session.default_category_id)
    product2 = create_test_product(db_session, "Product B", "SKU002", "Location Y", db_session.default_category_id)

    product_ids = [product1.product_id, product2.product_id]
    new_location = "Location Z"

    response = client.patch(
        "/products/bulk-update-location",
        json={"product_ids": product_ids, "new_location": new_location}
    )

    assert response.status_code == 200
    response_data = response.json()
    assert response_data["updated_count"] == 2
    assert len(response_data["errors"]) == 0

    # Verify in DB
    db_product1 = db_session.query(Product).filter(Product.product_id == product1.product_id).first()
    db_product2 = db_session.query(Product).filter(Product.product_id == product2.product_id).first()
    assert db_product1.location == new_location
    assert db_product2.location == new_location

def test_bulk_update_location_some_products_not_found(client: TestClient, db_session: Session):
    product1 = create_test_product(db_session, "Product C", "SKU003", "Location P", db_session.default_category_id)
    non_existent_id1 = 9998
    non_existent_id2 = 9999

    product_ids = [product1.product_id, non_existent_id1, non_existent_id2]
    new_location = "Location Q"

    response = client.patch(
        "/products/bulk-update-location",
        json={"product_ids": product_ids, "new_location": new_location}
    )

    assert response.status_code == 200
    response_data = response.json()
    assert response_data["updated_count"] == 1
    assert len(response_data["errors"]) == 2

    errors_product_ids = [err["product_id"] for err in response_data["errors"]]
    assert non_existent_id1 in errors_product_ids
    assert non_existent_id2 in errors_product_ids
    for err in response_data["errors"]:
        assert err["error"] == "Product not found"

    db_product1 = db_session.query(Product).filter(Product.product_id == product1.product_id).first()
    assert db_product1.location == new_location

def test_bulk_update_location_no_products_found(client: TestClient, db_session: Session):
    non_existent_ids = [10001, 10002, 10003]
    new_location = "Location R"

    response = client.patch(
        "/products/bulk-update-location",
        json={"product_ids": non_existent_ids, "new_location": new_location}
    )

    assert response.status_code == 200
    response_data = response.json()
    assert response_data["updated_count"] == 0
    assert len(response_data["errors"]) == 3

    errors_product_ids = [err["product_id"] for err in response_data["errors"]]
    for nid in non_existent_ids:
        assert nid in errors_product_ids
        assert db_session.query(Product).filter(Product.product_id == nid).first() is None # Ensure they don't exist

def test_bulk_update_location_empty_product_ids_list(client: TestClient, db_session: Session):
    new_location = "Location S"

    response = client.patch(
        "/products/bulk-update-location",
        json={"product_ids": [], "new_location": new_location}
    )

    assert response.status_code == 200
    response_data = response.json()
    assert response_data["updated_count"] == 0
    assert len(response_data["errors"]) == 0

def test_bulk_update_location_empty_new_location_string(client: TestClient, db_session: Session):
    product1 = create_test_product(db_session, "Product D", "SKU004", "Location T", db_session.default_category_id)

    response = client.patch(
        "/products/bulk-update-location",
        json={"product_ids": [product1.product_id], "new_location": ""} # Empty string for location
    )

    assert response.status_code == 422 # Unprocessable Entity for schema validation
    response_data = response.json()
    # Example check, FastAPI's exact error structure for validation can vary
    assert "detail" in response_data
    assert any("String should have at least 1 character" in str(err).lower() or "ensure this value has at least 1 character" in str(err).lower() for err in response_data["detail"])

def test_create_product_helper(db_session: Session): # A test for the helper itself
    category_id = db_session.default_category_id
    product = create_test_product(db_session, "Helper Test Product", "HTP001", "HelperLoc", category_id)
    assert product.product_id is not None
    assert product.name == "Helper Test Product"
    assert product.location == "HelperLoc"
    assert product.category_id == category_id

    # Check inventory creation
    inv = db_session.query(Inventory).filter(Inventory.product_id == product.product_id).first()
    assert inv is not None
    assert inv.quantity == 10

    # Try to create a product without a valid category (if your DB enforces FK constraints)
    # This might fail if your category setup isn't robust in the helper or fixture
    # product_no_cat = create_test_product(db_session, "No Cat Product", "NCP001", "NoCatLoc", 99999)
    # assert product_no_cat is None # Or expect an exception depending on FK handling

# Example of how you might test the default category creation in the fixture
def test_db_session_fixture_creates_default_category(db_session: Session):
    assert hasattr(db_session, 'default_category_id')
    assert db_session.default_category_id is not None
    category = db_session.query(ProductCategory).filter(ProductCategory.category_id == db_session.default_category_id).first()
    assert category is not None
    assert category.category_name == "Default Category"

# Ensure main_engine is not None if your tests depend on it for other reasons,
# though for test.db, we use 'engine' defined in this file.
# This is just a placeholder assertion.
def test_main_engine_exists():
    assert main_engine is not None
    # print(f"Main engine URL: {main_engine.url}") # For debugging if needed
    # This doesn't mean it's used for test sessions, just that it's imported.
    # The app.dependency_overrides ensures TestingSessionLocal is used for requests.

# (Optional) A test to ensure the override_get_db is working,
# though this is implicitly tested by other tests succeeding.
# You could inspect app.dependency_overrides if needed.
def test_db_override_is_active():
    assert get_db in app.dependency_overrides
    assert app.dependency_overrides[get_db] == override_get_db

    # You could even try to make a request to an endpoint that uses get_db
    # and check if the database used is the test.db (e.g., by checking file existence or a specific value)
    # For simplicity, this is often omitted if other tests pass.
    # client = TestClient(app) # A new client for this specific test if needed
    # response = client.get("/") # Assuming root endpoint exists and might touch DB indirectly or directly
    # assert response.status_code == 200 # Or whatever is expected
    # Further checks would be more involved.

# Test to ensure the test database file is created (and implicitly that SQLite is working)
def test_sqlite_db_file_creation():
    # After db_session fixture runs (implicitly via client or direct use),
    # the test.db file should exist if Base.metadata.create_all(engine) was called.
    # This test is a bit meta and depends on fixture execution order.
    # A simple way: make a client request that triggers db_session.
    client = TestClient(app)
    _ = client.get("/") # Make any request to trigger client fixture, then db_session

    # Check if 'test.db' file exists in the current directory (or wherever TEST_DATABASE_URL points)
    db_file_path = TEST_DATABASE_URL.split("sqlite:///./")[1] # Extracts 'test.db'
    assert os.path.exists(db_file_path), f"{db_file_path} should exist after tests run."
    # Note: This file might be empty if all tables are dropped, or it might contain schema.
    # The core idea is that the file interaction happened.
    # If you drop tables AND delete the file in teardown, this test might need adjustment.
    # For now, drop_all doesn't delete the file itself.

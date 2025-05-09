import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from app.main import app
from app.database import get_db, Base

# Use test database URL
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://airflow:airflow@localhost:5432/airflow_test")

# Create test database engine
engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def test_db():
    # Create the test database tables
    Base.metadata.create_all(bind=engine)
    
    # Create a database session
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop all tables after the test
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    # Override the get_db dependency to use the test database
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides = {}

def test_get_device_counts_integration(client, test_db):
    # Insert test data
    test_db.execute(
        """
        INSERT INTO dim_device 
        (device_id, device_name, is_active, status, is_online) 
        VALUES 
        ('test-device-1', 'Test Device 1', true, 'deployed', true),
        ('test-device-2', 'Test Device 2', true, 'deployed', false),
        ('test-device-3', 'Test Device 3', true, 'not deployed', false)
        """
    )
    test_db.commit()
    
    # Test the API endpoint
    response = client.get("/device-counts")
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_devices"] == 3
    assert data["active_devices"] == 1
    assert data["offline_devices"] == 2
    assert data["deployed_devices"] == 2
    assert data["not_deployed"] == 1
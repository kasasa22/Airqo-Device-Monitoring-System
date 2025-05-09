import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from sqlalchemy.orm import Session

from app.main import app
from app.device_performance_endpoint import calculate_performance_metrics

client = TestClient(app)

@pytest.fixture
def mock_db_session():
    """Fixture for mocked database session"""
    return MagicMock(spec=Session)

def test_get_device_performance_success(mock_db_session):
    # Mock the database responses
    device_data = {"device_key": 1, "device_id": "test-device-1", "first_seen": "2023-01-01"}
    mock_db_session.execute.return_value.first.return_value = MagicMock(_mapping=device_data)
    
    # Mock the readings data
    with patch("app.device_performance_endpoint.get_db", return_value=mock_db_session):
        response = client.get("/device-performance/test-device-1")
    
    assert response.status_code == 200
    assert "summary" in response.json()
    assert "dailyData" in response.json()

def test_get_device_performance_not_found(mock_db_session):
    # Mock database returning None for device
    mock_db_session.execute.return_value.first.return_value = None
    
    with patch("app.device_performance_endpoint.get_db", return_value=mock_db_session):
        response = client.get("/device-performance/non-existent-device")
    
    assert response.status_code == 404
    assert "detail" in response.json()

def test_calculate_performance_metrics():
    # Test the utility function directly
    device_dict = {"device_key": 1, "first_seen": "2023-01-01T00:00:00"}
    readings = [
        {"timestamp": "2023-01-02T10:00:00", "pm2_5": 10.5, "battery_voltage": 3.8},
        {"timestamp": "2023-01-02T11:00:00", "pm2_5": 11.2, "battery_voltage": 3.7}
    ]
    maintenance_records = []
    
    result = calculate_performance_metrics(device_dict, readings, 
                                          start_date="2023-01-01", 
                                          end_date="2023-01-03",
                                          maintenance_records=maintenance_records)
    
    assert "summary" in result
    assert "dataCompleteness" in result["summary"]
    assert len(result["dailyData"]) > 0
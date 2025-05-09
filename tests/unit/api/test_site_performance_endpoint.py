import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.site_performance_endpoint import create_json_response, convert_to_json_serializable

client = TestClient(app)

def test_get_locations(mock_db_session):
    # Mock the location data response
    mock_locations = [
        {"country": "Uganda", "city": "Kampala", "site_count": 5, "location_id": "kampala_city"}
    ]
    mock_result = MagicMock()
    mock_result._mapping = mock_locations
    mock_db_session.execute.return_value = [mock_result]
    
    with patch("app.site_performance_endpoint.get_db", return_value=mock_db_session):
        response = client.get("/site-analytics/locations")
    
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert "location_id" in response.json()[0]

def test_get_location_analytics(mock_db_session):
    # Mock the location data response
    location_data = {"location_type": "city", "city": "Kampala"}
    mock_db_session.execute.return_value.first.return_value = MagicMock(_mapping=location_data)
    
    # Mock site data
    sites_data = [{"site_key": 1, "site_name": "Test Site"}]
    mock_sites_result = MagicMock()
    mock_sites_result._mapping = sites_data
    
    # Set up the execute method to return different results on successive calls
    mock_db_session.execute.side_effect = [
        MagicMock(first=lambda: MagicMock(_mapping=location_data)),
        [mock_sites_result],
        MagicMock(first=lambda: MagicMock(_mapping={"total_sites": 1})),
        MagicMock(), # AQI distribution
        MagicMock()  # Time series data
    ]
    
    with patch("app.site_performance_endpoint.get_db", return_value=mock_db_session):
        response = client.get("/site-analytics/location/kampala_city?time_range=week")
    
    assert response.status_code == 200
    assert "location" in response.json()
    assert "sites" in response.json()
    assert "metrics" in response.json()
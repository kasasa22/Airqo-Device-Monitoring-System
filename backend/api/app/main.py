from fastapi import FastAPI, Depends, HTTPException, Response
from sqlalchemy import create_engine, text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, Extra
import os
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from decimal import Decimal
import json
import math
import sys
from app.device_performance_endpoint import router as performance_router, register_with_app


app = FastAPI()

register_with_app(app)

# Custom JSON encoder to handle special values
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            # Convert Decimal to float
            try:
                return float(obj)
            except:
                return str(obj)  # Fallback to string if float conversion fails
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://airflow:airflow@postgres:5432/airflow")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper function to convert values to JSON-serializable format
def convert_to_json_serializable(item):
    if isinstance(item, dict):
        return {k: convert_to_json_serializable(v) for k, v in item.items()}
    elif isinstance(item, list):
        return [convert_to_json_serializable(i) for i in item]
    elif isinstance(item, datetime):
        return item.isoformat()
    elif isinstance(item, Decimal):
        try:
            # Try to convert to float first
            float_val = float(item)
            # Check for NaN, Infinity, -Infinity
            if math.isnan(float_val) or math.isinf(float_val):
                return str(float_val)
            return float_val
        except (ValueError, OverflowError, TypeError):
            # If conversion to float fails, return as string
            return str(item)
    elif isinstance(item, float):
        # Handle NaN, Infinity, -Infinity for float values
        if math.isnan(item) or math.isinf(item):
            return str(item)
        return item
    # Handle string 'NaN' values
    elif isinstance(item, str) and item.lower() == 'nan':
        return None
    return item

# Import for arbitrary type handling
from pydantic import BaseModel, Field, Extra

# Comprehensive Pydantic model matching the API response
class Device(BaseModel):
    device_key: Optional[int] = None
    device_id: str
    device_name: Optional[str] = None
    long_name: Optional[str] = None
    alias: Optional[str] = None
    network: Optional[str] = None
    category: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    is_online: Optional[bool] = None
    is_primary_in_location: Optional[bool] = None
    mobility: Optional[bool] = None
    visibility: Optional[bool] = None
    height: Optional[float] = None
    mount_type: Optional[str] = None
    power_type: Optional[str] = None
    next_maintenance: Optional[str] = None
    deployment_date: Optional[str] = None
    description: Optional[str] = None
    device_number: Optional[int] = None
    auth_required: Optional[bool] = None
    created_at: Optional[str] = None
    groups: Optional[List[str]] = None
    device_codes: Optional[List[str]] = None
    first_seen: Optional[str] = None
    last_updated: Optional[str] = None
    approximate_distance_in_km: Optional[float] = None
    bearing_in_radians: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    site: Optional[Dict[str, Any]] = None
    grids: Optional[List[Dict[str, Any]]] = None
    previous_sites: Optional[List[Any]] = None
    cohorts: Optional[List[Any]] = None
    
    class Config:
        orm_mode = True
        # Allow extra fields to prevent validation errors
        extra = Extra.ignore 
        # Make it more flexible with arbitrary types
        arbitrary_types_allowed = True

class DeviceCount(BaseModel):
    total_devices: int
    active_devices: int
    offline_devices: int
    deployed_devices: int 
    not_deployed: int
    recalled_devices: int

# Custom response to handle JSON encoding
def create_json_response(content):
    """Create a Response with properly encoded JSON content"""
    json_content = json.dumps(content, cls=CustomJSONEncoder)
    return Response(content=json_content, media_type="application/json")


# Endpoint to get all devices
@app.get("/devices")
def get_all_devices(db=Depends(get_db)):
    try:
        # Query to select all fields from the database
        result = db.execute(text("SELECT * FROM dim_device"))
        devices = []
        
        # Get column names for logging
        column_names = result.keys()
        print(f"Database columns: {column_names}")
        
        for idx, row in enumerate(result):
            try:
                # Convert row to dictionary
                device_dict = dict(row._mapping)
                
                # Print first row for debugging
                if idx == 0:
                    print(f"Raw first row data: {device_dict}")
                
                # Process 'NaN' string values before conversion
                for key, value in device_dict.items():
                    if isinstance(value, str) and value.lower() == 'nan':
                        device_dict[key] = None
                
                # Convert datetime objects and Decimal to JSON-serializable values
                device_dict = convert_to_json_serializable(device_dict)
                
                # Filter out any keys that don't exist in the Device model
                # to avoid validation errors with unexpected fields
                device_model_fields = Device.__annotations__.keys()
                filtered_dict = {k: v for k, v in device_dict.items() if k in device_model_fields}
                
                # Add minimum required fields if missing
                if 'device_id' not in filtered_dict:
                    if 'device_key' in filtered_dict:
                        filtered_dict['device_id'] = f"device_{filtered_dict['device_key']}"
                    else:
                        filtered_dict['device_id'] = f"unknown_device_{idx}"
                
                # Add device to list
                devices.append(filtered_dict)
                
            except Exception as row_error:
                print(f"Error processing row {idx}: {str(row_error)}")
                continue
            
        print(f"Successfully processed {len(devices)} devices")
        return create_json_response(devices)
    except Exception as e:
        print(f"Critical error in get_all_devices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch devices: {str(e)}")

# Endpoint to get a specific device by ID
@app.get("/devices/{device_id}")
def get_device(device_id: str, db=Depends(get_db)):
    try:
        # Query to select specific device with all fields
        result = db.execute(
            text("SELECT * FROM dim_device WHERE device_id = :device_id"), 
            {"device_id": device_id}
        )
        device = result.first()
        
        if not device:
            raise HTTPException(status_code=404, detail=f"Device with ID {device_id} not found")
        
        # Convert row to dictionary
        device_dict = dict(device._mapping)
        
        # Handle 'NaN' string values
        for key, value in device_dict.items():
            if isinstance(value, str) and value.lower() == 'nan':
                device_dict[key] = None
        
        # Convert datetime objects and decimal values to JSON-serializable format
        device_dict = convert_to_json_serializable(device_dict)
        
        # Get location data for this device
        location_result = db.execute(
            text("SELECT * FROM dim_location WHERE device_key = :device_key"),
            {"device_key": device_dict['device_key']}
        )
        location = location_result.first()
        
        if location:
            location_dict = dict(location._mapping)
            # Handle 'NaN' string values
            for key, value in location_dict.items():
                if isinstance(value, str) and value.lower() == 'nan':
                    location_dict[key] = None
                    
            # Convert datetime objects and decimal values
            location_dict = convert_to_json_serializable(location_dict)
            
            device_dict['latitude'] = location_dict.get('latitude')
            device_dict['longitude'] = location_dict.get('longitude')
            
            # Create a site object
            site = {
                "_id": location_dict.get('site_id'),
                "name": location_dict.get('site_name'),
                "location_name": location_dict.get('location_name'),
                "search_name": location_dict.get('search_name'),
                "data_provider": location_dict.get('data_provider')
            }
            device_dict['site'] = site
        
        return create_json_response(device_dict)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_device: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch device: {str(e)}")

# Endpoint to get device counts for dashboard
@app.get("/device-counts")
def get_device_counts(db=Depends(get_db)):
    try:
        # Get total devices
        total_result = db.execute(text("SELECT COUNT(*) FROM dim_device"))
        total_devices = total_result.scalar()
        
        # Get active devices (is_active = true)
        active_result = db.execute(text("SELECT COUNT(*) FROM dim_device WHERE is_online = true"))
        active_devices = active_result.scalar()
        
        # Get offline devices (is_online = false)
        offline_result = db.execute(text("SELECT COUNT(*) FROM dim_device WHERE is_online = false"))
        offline_devices = offline_result.scalar()
        
        # Get deployed devices based on status column
        deployed_result = db.execute(text("""
            SELECT COUNT(*) FROM dim_device 
            WHERE status = 'deployed'
        """))
        deployed_devices = deployed_result.scalar()
        
        # Not deployed devices based on status column
        not_deployed_result = db.execute(text("""
            SELECT COUNT(*) FROM dim_device 
            WHERE status = 'not deployed'
        """))
        not_deployed = not_deployed_result.scalar()
        
        # Recalled devices based on status column
        recalled_result = db.execute(text("""
            SELECT COUNT(*) FROM dim_device 
            WHERE status = 'recalled'
        """))
        recalled_devices = recalled_result.scalar()
        
        return {
            "total_devices": total_devices,
            "active_devices": active_devices,
            "offline_devices": offline_devices,
            "deployed_devices": deployed_devices,
            "not_deployed": not_deployed,
            "recalled_devices": recalled_devices
        }
    except Exception as e:
        print(f"Error in device counts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch device counts: {str(e)}")

# Additional endpoint to get device status statistics
@app.get("/device-status")
def get_device_status(db=Depends(get_db)):
    try:
        result = db.execute(text("""
            SELECT 
                status,
                COUNT(*) as count
            FROM dim_device
            GROUP BY status
        """))
        
        status_counts = []
        for row in result:
            status_dict = dict(row._mapping)
            # Convert any decimal values
            status_dict = convert_to_json_serializable(status_dict)
            status_counts.append(status_dict)
            
        return create_json_response(status_counts)
    except Exception as e:
        print(f"Error in device status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch device status: {str(e)}")

# New endpoint to get device location data for mapping
@app.get("/device-locations")
def get_device_locations(db=Depends(get_db)):
    try:
        # Use LEFT JOIN instead of JOIN to diagnose possible issues
        result = db.execute(text("""
            SELECT 
                d.device_id,
                d.device_name,
                d.status,
                d.is_online,
                l.latitude,
                l.longitude,
                l.site_name
            FROM dim_device d
            LEFT JOIN dim_location l ON d.device_key = l.device_key
        """))
        
        all_devices = []
        devices_with_location = []
        missing_location = []
        
        for row in result:
            try:
                location_dict = dict(row._mapping)
                
                # Handle 'NaN' string values
                for key, value in location_dict.items():
                    if isinstance(value, str) and value.lower() == 'nan':
                        location_dict[key] = None
                
                # Convert datetime and decimal objects
                location_dict = convert_to_json_serializable(location_dict)
                all_devices.append(location_dict)
                
                # Check if this device has location data
                if location_dict.get('latitude') is not None and location_dict.get('longitude') is not None:
                    devices_with_location.append(location_dict)
                else:
                    missing_location.append(location_dict.get('device_id'))
            except Exception as row_error:
                print(f"Error processing location row: {str(row_error)}")
                continue
        
        # Print diagnostics
        print(f"Total devices: {len(all_devices)}")
        print(f"Devices with location: {len(devices_with_location)}")
        print(f"Devices missing location: {len(missing_location)}")
        if missing_location:
            print(f"First few devices missing location: {missing_location[:5]}")
            
        return create_json_response(devices_with_location)
    except Exception as e:
        print(f"Error in device-locations endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch device locations: {str(e)}")

# New endpoint to get deployment history
@app.get("/deployment-history")
def get_deployment_history(days: int = 30, db=Depends(get_db)):
    try:
        result = db.execute(text("""
            WITH daily_counts AS (
                SELECT 
                    date_trunc('day', timestamp) as day,
                    COUNT(DISTINCT device_key) FILTER (WHERE device_status = 'deployed') as deployed,
                    COUNT(DISTINCT device_key) FILTER (WHERE device_status = 'not deployed') as not_deployed,
                    COUNT(DISTINCT device_key) FILTER (WHERE device_status = 'recalled') as recalled
                FROM fact_device_status
                WHERE timestamp > current_date - interval ':days days'
                GROUP BY date_trunc('day', timestamp)
                ORDER BY date_trunc('day', timestamp)
            )
            SELECT 
                day,
                deployed,
                not_deployed,
                recalled
            FROM daily_counts
        """), {"days": days})
        
        history = []
        for row in result:
            history_dict = dict(row._mapping)
            # Convert datetime objects and decimal values
            history_dict = convert_to_json_serializable(history_dict)
            history.append(history_dict)
            
        return create_json_response(history)
    except Exception as e:
        print(f"Error in deployment history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch deployment history: {str(e)}")

# New endpoint to get maintenance metrics
@app.get("/maintenance-metrics")
def get_maintenance_metrics(db=Depends(get_db)):
    try:
        # Get devices due for maintenance in the next 7 days
        upcoming_result = db.execute(text("""
            SELECT COUNT(*) 
            FROM dim_device 
            WHERE next_maintenance BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        """))
        upcoming_maintenance = upcoming_result.scalar() or 0
        
        # Get devices with overdue maintenance
        overdue_result = db.execute(text("""
            SELECT COUNT(*) 
            FROM dim_device 
            WHERE next_maintenance < CURRENT_DATE
        """))
        overdue_maintenance = overdue_result.scalar() or 0
        
        # Calculate average days between maintenance
        avg_cycle_result = db.execute(text("""
            SELECT AVG(EXTRACT(EPOCH FROM (next_maintenance - last_updated)) / 86400)
            FROM dim_device
            WHERE next_maintenance IS NOT NULL AND last_updated IS NOT NULL
        """))
        avg_cycle = avg_cycle_result.scalar()
        
        # Convert Decimal to float if needed
        avg_maintenance_cycle = float(avg_cycle) if avg_cycle is not None else 0
        
        return {
            "upcoming_maintenance": upcoming_maintenance,
            "overdue_maintenance": overdue_maintenance,
            "avg_maintenance_cycle_days": round(avg_maintenance_cycle, 1)
        }
    except Exception as e:
        print(f"Error in maintenance metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance metrics: {str(e)}")

# Simple endpoint for testing
@app.get("/")
def read_root():
    return {"message": "AirQo Device Health Monitoring API is running"}

# Simple devices endpoint that returns minimal data
@app.get("/devices-simple")
def get_devices_simple(db=Depends(get_db)):
    try:
        result = db.execute(text("""
            SELECT 
                device_key, 
                device_id, 
                device_name, 
                status, 
                is_online,
                is_active 
            FROM dim_device
        """))
        
        devices = []
        for row in result:
            device_dict = dict(row._mapping)
            devices.append(device_dict)
            
        return devices
    except Exception as e:
        print(f"Error in simple devices endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch simple devices: {str(e)}")
@app.get("/valid-device-locations")
def get_valid_device_locations(db=Depends(get_db)):
    try:
        # Query that joins dim_device, dim_location, and latest readings with site information
        result = db.execute(text("""
            WITH latest_readings AS (
                SELECT DISTINCT ON (device_key) 
                    device_key,
                    site_key,
                    timestamp,
                    pm2_5,
                    pm10
                FROM fact_device_readings
                ORDER BY device_key, timestamp DESC
            )
            SELECT 
                d.device_id,
                d.device_name,
                d.status,
                d.is_online,
                l.latitude,
                l.longitude,
                l.admin_level_country,
                l.admin_level_city,
                l.admin_level_division,
                s.site_id,
                s.site_name,
                s.location_name,
                s.search_name,
                s.village,
                s.town,
                s.city,
                s.district,
                s.country,
                s.data_provider,
                s.site_category,
                r.pm2_5,
                r.pm10,
                r.timestamp as reading_timestamp
            FROM dim_device d
            INNER JOIN dim_location l ON d.device_key = l.device_key
            LEFT JOIN latest_readings r ON d.device_key = r.device_key
            LEFT JOIN dim_site s ON r.site_key = s.site_key
            WHERE 
                l.latitude IS NOT NULL 
                AND l.longitude IS NOT NULL
                AND l.is_active = true
                AND d.is_active = true
                AND d.status = 'deployed'
        """))
        
        device_locations = []
        for row in result:
            try:
                location_dict = dict(row._mapping)
                
                # Handle 'NaN' string values
                for key, value in location_dict.items():
                    if isinstance(value, str) and value.lower() == 'nan':
                        location_dict[key] = None
                
                # Convert datetime and decimal objects
                location_dict = convert_to_json_serializable(location_dict)
                
                # Format the response structure
                formatted_location = {
                    "id": location_dict["device_id"],
                    "name": location_dict["device_name"],
                    "status": "ACTIVE" if location_dict["status"] == "deployed" and location_dict["is_online"] else "INACTIVE",
                    "latitude": location_dict["latitude"],
                    "longitude": location_dict["longitude"],
                    "pm2_5": location_dict.get("pm2_5"),
                    "pm10": location_dict.get("pm10"),
                    "reading_timestamp": location_dict.get("reading_timestamp"),
                    "location": {
                        "name": location_dict.get("location_name") or location_dict.get("admin_level_division") or location_dict.get("city"),
                        "admin_level_country": location_dict.get("admin_level_country") or location_dict.get("country"),
                        "admin_level_city": location_dict.get("admin_level_city") or location_dict.get("city"),
                        "admin_level_division": location_dict.get("admin_level_division"),
                        "village": location_dict.get("village"),
                        "site_name": location_dict.get("site_name"),
                        "site_category": location_dict.get("site_category"),
                        "site_id": location_dict.get("site_id"),
                        "data_provider": location_dict.get("data_provider")
                    }
                }
                
                device_locations.append(formatted_location)
                
            except Exception as row_error:
                print(f"Error processing location row: {str(row_error)}")
                continue
        
        # Print diagnostics
        print(f"Retrieved {len(device_locations)} active and deployed device locations with valid coordinates")
            
        return create_json_response(device_locations)
    except Exception as e:
        print(f"Error in valid-device-locations endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch valid device locations: {str(e)}")
    

@app.get("/device-detail/{device_id}")
def get_device_detail(device_id: str, db=Depends(get_db)):
    try:
        # Complex query joining multiple tables to get comprehensive device information
        query = text("""
            WITH latest_readings AS (
                SELECT DISTINCT ON (device_key) 
                    device_key,
                    site_key,
                    timestamp,
                    pm2_5,
                    pm10,
                    no2,
                    aqi_category,
                    aqi_color,
                    aqi_color_name
                FROM fact_device_readings
                ORDER BY device_key, timestamp DESC
            ),
            latest_status AS (
                SELECT DISTINCT ON (device_key)
                    device_key,
                    timestamp,
                    is_online,
                    device_status
                FROM fact_device_status
                ORDER BY device_key, timestamp DESC
            )
            SELECT 
                -- Device basic information
                d.device_key,
                d.device_id,
                d.device_name,
                d.network,
                d.category,
                d.is_active,
                d.status,
                d.mount_type,
                d.power_type,
                d.height,
                d.next_maintenance,
                d.first_seen,
                d.last_updated,
                
                -- Location information
                l.location_key,
                l.latitude,
                l.longitude,
                l.location_name,
                l.search_name,
                l.village,
                l.admin_level_country,
                l.admin_level_city,
                l.admin_level_division,
                l.site_category,
                l.site_id,
                l.site_name,
                l.deployment_date,
                
                -- Latest readings
                r.pm2_5,
                r.pm10,
                r.no2,
                r.timestamp as reading_timestamp,
                r.aqi_category,
                r.aqi_color,
                r.aqi_color_name,
                
                -- Latest status
                st.is_online as current_is_online,
                st.device_status as current_device_status,
                st.timestamp as status_timestamp,
                
                -- Site information
                s.site_name as full_site_name,
                s.location_name as full_location_name,
                s.search_name as full_search_name,
                s.village as full_village,
                s.town,
                s.city,
                s.district,
                s.country,
                s.data_provider,
                s.site_category as full_site_category
                
            FROM dim_device d
            LEFT JOIN dim_location l ON d.device_key = l.device_key AND l.is_active = true
            LEFT JOIN latest_readings r ON d.device_key = r.device_key
            LEFT JOIN latest_status st ON d.device_key = st.device_key
            LEFT JOIN dim_site s ON r.site_key = s.site_key
            WHERE d.device_id = :device_id
        """)
        
        result = db.execute(query, {"device_id": device_id})
        device_row = result.first()
        
        if not device_row:
            raise HTTPException(status_code=404, detail=f"Device with ID {device_id} not found")
        
        # Convert row to dictionary
        device_dict = dict(device_row._mapping)
        
        # Handle 'NaN' string values
        for key, value in device_dict.items():
            if isinstance(value, str) and value.lower() == 'nan':
                device_dict[key] = None
        
        # Convert datetime objects and decimal values to JSON-serializable format
        device_dict = convert_to_json_serializable(device_dict)
        
        # Get maintenance history if available
        maintenance_history_query = text("""
            WITH maintenance_entries AS (
                SELECT 
                    timestamp,
                    CASE 
                        WHEN LAG(is_online) OVER (ORDER BY timestamp) = false AND is_online = true THEN 'Restored'
                        WHEN LAG(is_online) OVER (ORDER BY timestamp) = true AND is_online = false THEN 'Offline'
                        WHEN LAG(device_status) OVER (ORDER BY timestamp) != device_status THEN 'Status Change'
                        ELSE null
                    END as maintenance_type,
                    CASE 
                        WHEN LAG(is_online) OVER (ORDER BY timestamp) = false AND is_online = true THEN 'Device came back online'
                        WHEN LAG(is_online) OVER (ORDER BY timestamp) = true AND is_online = false THEN 'Device went offline'
                        WHEN LAG(device_status) OVER (ORDER BY timestamp) != device_status THEN 'Status changed to ' || device_status
                        ELSE null
                    END as description
                FROM fact_device_status
                WHERE device_key = :device_key
                ORDER BY timestamp DESC
            )
            SELECT 
                timestamp,
                maintenance_type,
                description
            FROM maintenance_entries
            WHERE maintenance_type IS NOT NULL
            LIMIT 10
        """)
        
        history_result = db.execute(maintenance_history_query, {"device_key": device_dict['device_key']})
        maintenance_history = []
        
        for row in history_result:
            history_dict = dict(row._mapping)
            history_dict = convert_to_json_serializable(history_dict)
            maintenance_history.append(history_dict)
        
        # Get readings history
        readings_history_query = text("""
            SELECT 
                timestamp,
                pm2_5,
                pm10,
                no2,
                aqi_category
            FROM fact_device_readings
            WHERE device_key = :device_key
            ORDER BY timestamp DESC
            LIMIT 20
        """)
        
        readings_result = db.execute(readings_history_query, {"device_key": device_dict['device_key']})
        readings_history = []
        
        for row in readings_result:
            reading_dict = dict(row._mapping)
            reading_dict = convert_to_json_serializable(reading_dict)
            readings_history.append(reading_dict)
        
        # Structure the response in a more organized way
        response = {
            "device": {
                "id": device_dict["device_id"],
                "name": device_dict["device_name"],
                "status": device_dict["status"],
                "is_online": device_dict["current_is_online"],
                "network": device_dict["network"],
                "category": device_dict["category"],
                "is_active": device_dict["is_active"],
                "mount_type": device_dict["mount_type"],
                "power_type": device_dict["power_type"],
                "height": device_dict["height"],
                "next_maintenance": device_dict["next_maintenance"],
                "first_seen": device_dict["first_seen"],
                "last_updated": device_dict["last_updated"]
            },
            "location": {
                "latitude": device_dict["latitude"],
                "longitude": device_dict["longitude"],
                "name": device_dict["location_name"] or device_dict["full_location_name"],
                "country": device_dict["admin_level_country"] or device_dict["country"],
                "city": device_dict["admin_level_city"] or device_dict["city"],
                "division": device_dict["admin_level_division"],
                "village": device_dict["village"] or device_dict["full_village"],
                "deployment_date": device_dict["deployment_date"]
            },
            "site": {
                "id": device_dict["site_id"],
                "name": device_dict["site_name"] or device_dict["full_site_name"],
                "category": device_dict["site_category"] or device_dict["full_site_category"],
                "data_provider": device_dict["data_provider"]
            },
            "latest_reading": {
                "timestamp": device_dict["reading_timestamp"],
                "pm2_5": device_dict["pm2_5"],
                "pm10": device_dict["pm10"],
                "no2": device_dict["no2"],
                "aqi_category": device_dict["aqi_category"],
                "aqi_color": device_dict["aqi_color"]
            },
            "maintenance_history": maintenance_history,
            "readings_history": readings_history
        }
        
        return create_json_response(response)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_device_detail: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch device details: {str(e)}")
    
@app.get("/health-tips/device/{device_id}")
def get_health_tips_by_device(device_id: str, db=Depends(get_db)):
    try:
        # First get the device_key from the device_id
        device_query = text("""
            SELECT device_key FROM dim_device 
            WHERE device_id = :device_id
        """)
        
        device_result = db.execute(device_query, {"device_id": device_id})
        device_row = device_result.first()
        
        if not device_row:
            raise HTTPException(status_code=404, detail=f"Device with ID {device_id} not found")
        
        device_key = device_row[0]
        
        # Get the latest reading_key for this device
        reading_query = text("""
            SELECT reading_key, aqi_category
            FROM fact_device_readings
            WHERE device_key = :device_key
            ORDER BY timestamp DESC
            LIMIT 1
        """)
        
        reading_result = db.execute(reading_query, {"device_key": device_key})
        reading_row = reading_result.first()
        
        if not reading_row:
            return {"tips": [], "message": "No readings found for this device"}
        
        reading_key = reading_row[0]
        aqi_category = reading_row[1]
        
        # Get health tips associated with this reading
        tips_query = text("""
            SELECT 
                tip_key,
                tip_id,
                title,
                description,
                image_url
            FROM fact_health_tips
            WHERE reading_key = :reading_key
        """)
        
        tips_result = db.execute(tips_query, {"reading_key": reading_key})
        tips = []
        
        for row in tips_result:
            tip_dict = dict(row._mapping)
            # Convert values to JSON-serializable format
            tip_dict = convert_to_json_serializable(tip_dict)
            tips.append(tip_dict)
        
        if not tips:
            # No tips found for this specific reading_key
            # Try to get general tips for this AQI category
            return get_health_tips_by_category(aqi_category, db)
        
        return {"tips": tips, "aqi_category": aqi_category}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching health tips by device: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch health tips: {str(e)}")
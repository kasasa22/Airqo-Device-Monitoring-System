from fastapi import FastAPI, Depends, HTTPException, Response
from sqlalchemy import create_engine, text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, Extra
import os
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from decimal import Decimal
 
from datetime import datetime, timezone
from dateutil import tz

import json
import math
import sys
from app.device_performance_endpoint import router as performance_router, register_with_app
from app.site_performance_endpoint import router as site_router, register_with_app as register_site_endpoints
from app.data_transmission_endpoint import router as data_transmission_router, register_with_app as register_data_analytics
from app.network_analysis_endpoint import router as network_router, register_with_app as register_network_analysis


from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
import datetime

from . import database
from app.superAdmin import create_super_admin
from . import models, schemas
app = FastAPI()


register_with_app(app)
register_site_endpoints(app)
register_data_analytics(app)
register_network_analysis(app)


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

# Add CORS middleware with updated configuration
app.add_middleware(
    CORSMiddleware,
    # Update to include both localhost and your VM hostname
    allow_origins=[
        "http://localhost:3000",
        "http://srv792913.hstgr.cloud:3000",
        # It's good practice to include HTTPS variants as well
        "https://srv792913.hstgr.cloud:3000",
        # You might also want to add a wildcard for all subdomains
        "http://*.hstgr.cloud:3000",
        "http://srv828289.hstgr.cloud:3000",
        "https://srv828289.hstgr.cloud:3000",
        "http://srv828289.hstgr.cloud:8000",
        "http://frontend:3000",
        "http://172.18.0.6:3000",

    ],
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
    # Handle dictionary case
    if isinstance(item, dict):
        return {k: convert_to_json_serializable(v) for k, v in item.items()}
    # Handle list case
    elif isinstance(item, list):
        return [convert_to_json_serializable(i) for i in item]
    # Handle datetime
    elif isinstance(item, datetime):
        return item.isoformat()
    # Handle Decimal
    elif isinstance(item, Decimal):
        try:
            float_val = float(item)
            if math.isnan(float_val) or math.isinf(float_val):
                return str(float_val)
            return float_val
        except (ValueError, OverflowError, TypeError):
            return str(item)
    # Handle float
    elif isinstance(item, float):
        if math.isnan(item) or math.isinf(item):
            return str(item)
        return item
    # Handle string 'NaN' values
    elif isinstance(item, str):
        if item.lower() == 'nan':
            return None
        return item
    # Return any other type as is
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
    # except HTTPException:
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
            try:
                # Convert row to dictionary first
                status_dict = dict(row._mapping)
                
                # Handle 'NaN' string values explicitly before conversion
                for key, value in status_dict.items():
                    if isinstance(value, str) and value.lower() == 'nan':
                        status_dict[key] = None
                
                # Convert any decimal values with proper error handling
                for key, value in status_dict.items():
                    if isinstance(value, Decimal):
                        try:
                            status_dict[key] = float(value)
                        except:
                            status_dict[key] = str(value)
                    elif isinstance(value, datetime):
                        status_dict[key] = value.isoformat()
                
                status_counts.append(status_dict)
                
            except Exception as row_error:
                print(f"Error processing status row: {str(row_error)}")
                continue
            
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
        # Query remains the same
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
                # Create a simple dictionary from the row
                row_dict = {}
                for column, value in row._mapping.items():
                    row_dict[column] = value
                
                # Process the data manually with explicit type checks
                device_id = str(row_dict.get("device_id", "")) if row_dict.get("device_id") is not None else ""
                device_name = str(row_dict.get("device_name", "")) if row_dict.get("device_name") is not None else ""
                status = row_dict.get("status")
                is_online = row_dict.get("is_online")
                
                # Handle numeric values that could be NaN
                try:
                    latitude = float(row_dict.get("latitude"))
                    # Check if value is NaN and convert to null
                    if math.isnan(latitude):
                        latitude = None
                except (TypeError, ValueError):
                    latitude = None
                    
                try:
                    longitude = float(row_dict.get("longitude"))
                    # Check if value is NaN and convert to null
                    if math.isnan(longitude):
                        longitude = None
                except (TypeError, ValueError):
                    longitude = None
                
                # Only include rows with valid coordinates
                if latitude is None or longitude is None:
                    continue
                
                # Process PM values
                try:
                    pm2_5 = float(row_dict.get("pm2_5"))
                    # Check if value is NaN
                    if math.isnan(pm2_5):
                        pm2_5 = None
                except (TypeError, ValueError):
                    pm2_5 = None
                    
                try:
                    pm10 = float(row_dict.get("pm10"))
                    # Check if value is NaN
                    if math.isnan(pm10):
                        pm10 = None
                except (TypeError, ValueError):
                    pm10 = None
                
                # Handle timestamp
                reading_timestamp = None
                if row_dict.get("reading_timestamp") is not None:
                    if hasattr(row_dict["reading_timestamp"], "isoformat"):
                        reading_timestamp = row_dict["reading_timestamp"].isoformat()
                    else:
                        reading_timestamp = str(row_dict["reading_timestamp"])
                
                # Build location object with careful null handling
                location_name = row_dict.get("location_name")
                if location_name is not None and isinstance(location_name, str) and location_name.lower() == 'nan':
                    location_name = None
                
                admin_level_division = row_dict.get("admin_level_division")
                if admin_level_division is not None and isinstance(admin_level_division, str) and admin_level_division.lower() == 'nan':
                    admin_level_division = None
                    
                city = row_dict.get("city")
                if city is not None and isinstance(city, str) and city.lower() == 'nan':
                    city = None
                
                # Use the first non-null value
                display_name = location_name
                if display_name is None:
                    display_name = admin_level_division
                if display_name is None:
                    display_name = city
                if display_name is None:
                    display_name = "Unknown Location"
                
                # Similarly handle country and city
                admin_country = row_dict.get("admin_level_country")
                if admin_country is not None and isinstance(admin_country, str) and admin_country.lower() == 'nan':
                    admin_country = None
                    
                country = row_dict.get("country")
                if country is not None and isinstance(country, str) and country.lower() == 'nan':
                    country = None
                
                display_country = admin_country if admin_country is not None else country
                
                admin_city = row_dict.get("admin_level_city")
                if admin_city is not None and isinstance(admin_city, str) and admin_city.lower() == 'nan':
                    admin_city = None
                
                display_city = admin_city if admin_city is not None else city
                
                # Create the location object
                formatted_location = {
                    "id": device_id,
                    "name": device_name,
                    "status": "ACTIVE" if status == "deployed" and is_online else "INACTIVE",
                    "latitude": latitude,
                    "longitude": longitude,
                    "pm2_5": pm2_5,
                    "pm10": pm10,
                    "reading_timestamp": reading_timestamp,
                    "location": {
                        "name": display_name,
                        "admin_level_country": display_country,
                        "admin_level_city": display_city,
                        "admin_level_division": admin_level_division,
                        "village": row_dict.get("village"),
                        "site_name": row_dict.get("site_name"),
                        "site_category": row_dict.get("site_category"),
                        "site_id": row_dict.get("site_id"),
                        "data_provider": row_dict.get("data_provider")
                    }
                }
                
                # Ensure no NaN values are in the JSON
                for key, value in formatted_location["location"].items():
                    if isinstance(value, float) and math.isnan(value):
                        formatted_location["location"][key] = None
                    elif isinstance(value, str) and value.lower() == 'nan':
                        formatted_location["location"][key] = None
                
                device_locations.append(formatted_location)
                
            except Exception as row_error:
                print(f"Error processing location row: {str(row_error)}")
                continue
        
        # Print diagnostics
        print(f"Retrieved {len(device_locations)} active and deployed device locations with valid coordinates")
            
        # Create a JSON response, being very careful to handle any unexpected values
        def json_encoder(obj):
            if isinstance(obj, (datetime, date)):
                return obj.isoformat()
            elif isinstance(obj, Decimal):
                return float(obj)
            elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
                return None
            return str(obj)
        
        # Use the custom encoder to ensure valid JSON
        json_content = json.dumps(device_locations, default=json_encoder)
        return Response(content=json_content, media_type="application/json")
    
    except Exception as e:
        print(f"Error in valid-device-locations endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch valid device locations: {str(e)}")
     
     
     



 
     
     
     # my code that has my routes
# Create tables if they don't exist
models.Base.metadata.create_all(bind=database.engine)

# JWT Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 setup
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Ensure Super Admin exists during app startup
@app.on_event("startup")
async def on_startup():
    create_super_admin()  # No need to pass db since it's created inside the function

# Password verification and hashing functions
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Get current user from the JWT token
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# User login route
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "status": user.status
        }
    }

# User management routes (Super Admin can create other users)
@app.post("/users/", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new user (Only Super Admin can access this endpoint)"""
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmin can create new users"
        )
    
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        status=user.status,
        phone=user.phone,
        location=user.location,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

    

@app.post("/users/", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Create a new user.
    Only users with the 'superadmin' role are authorized to access this endpoint.
    """
    # Ensure the requester is a superadmin
    if not current_user or current_user.role.lower() != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmin can create new users."
        )

    # Check if the user already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Hash the user's password
    hashed_password = get_password_hash(user.password)

    # Create the new user object
    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role,
        status=user.status,
        phone=user.phone,
        location=user.location,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )

    # Add and commit the new user
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.get("/users/", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    users = db.query(models.User).all()
    return users


# Add these endpoints to your FastAPI main.py file

# Get current user profile endpoint
@app.get("/users/me/", response_model=schemas.User)
@app.get("/profile/", response_model=schemas.User)
@app.get("/auth/me/", response_model=schemas.User)
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    """Get the current authenticated user's profile"""
    return current_user

# Update current user profile endpoint
@app.put("/users/me/", response_model=schemas.User)
@app.put("/profile/", response_model=schemas.User)
@app.put("/auth/me/", response_model=schemas.User)
def update_current_user_profile(
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update the current authenticated user's profile"""
    
    # Check if email is being changed and if it's already taken by another user
    if user_update.email and user_update.email != current_user.email:
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email,
            models.User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered to another user"
            )
    
    # Update basic profile fields
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name
    if user_update.email is not None:
        current_user.email = user_update.email
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.location is not None:
        current_user.location = user_update.location
    
    # Handle password change if provided
    if user_update.new_password and user_update.current_password:
        # Verify current password
        if not verify_password(user_update.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update to new password
        current_user.password_hash = get_password_hash(user_update.new_password)
    
    # Update timestamp
    current_user.updated_at = datetime.datetime.utcnow()
    
    # Save changes
    db.commit()
    db.refresh(current_user)
    
    return current_user

# Update specific user profile endpoint (for admin use)
@app.put("/users/{user_id}/", response_model=schemas.User)
def update_user_profile(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a specific user's profile (Admin/SuperAdmin only)"""
    
    # Check if current user has permission to update other users
    if current_user.role.lower() not in ["administrator", "superadmin"] and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user's profile"
        )
    
    # Get the user to update
    user_to_update = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != user_to_update.email:
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email,
            models.User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered to another user"
            )
    
    # Update fields
    if user_update.first_name is not None:
        user_to_update.first_name = user_update.first_name
    if user_update.last_name is not None:
        user_to_update.last_name = user_update.last_name
    if user_update.email is not None:
        user_to_update.email = user_update.email
    if user_update.phone is not None:
        user_to_update.phone = user_update.phone
    if user_update.location is not None:
        user_to_update.location = user_update.location
    
    # Only superadmin can change roles and status
    if current_user.role.lower() == "superadmin":
        if user_update.role is not None:
            user_to_update.role = user_update.role
        if user_update.status is not None:
            user_to_update.status = user_update.status
    
    # Handle password change (admin can reset passwords)
    if user_update.new_password:
        if current_user.id == user_id and user_update.current_password:
            # User updating their own password - verify current password
            if not verify_password(user_update.current_password, user_to_update.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is incorrect"
                )
        elif current_user.role.lower() == "superadmin":
            # Superadmin can reset any password without current password
            pass
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot change password for other users"
            )
        
        user_to_update.password_hash = get_password_hash(user_update.new_password)
    
    # Update timestamp
    user_to_update.updated_at = datetime.datetime.utcnow()
    
    # Save changes
    db.commit()
    db.refresh(user_to_update)
    
    return user_to_update

# Delete user endpoint (SuperAdmin only)
@app.delete("/users/{user_id}/")
def delete_user(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a user (SuperAdmin only)"""
    
    if current_user.role.lower() != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmin can delete users"
        )
    
    # Prevent self-deletion
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user_to_delete)
    db.commit()
    
    return {"message": "User deleted successfully"}

# Change password endpoint (separate endpoint for password changes)
@app.post("/users/change-password/")
def change_password(
    password_change: schemas.PasswordChange,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Change current user's password"""
    
    # Verify current password
    if not verify_password(password_change.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(password_change.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_change.new_password)
    current_user.updated_at = datetime.datetime.utcnow()
    
    db.commit()
    
    return {"message": "Password changed successfully"}

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
        
       
        
        # Get the EAT timezone
        eat_timezone = tz.gettz('Africa/Kampala')
        
        # Function to convert timestamps to EAT
        def convert_to_eat(timestamp):
            if timestamp is None:
                return None
                
            # If timestamp has no timezone info, assume it's UTC
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
                
            # Convert to EAT timezone
            eat_time = timestamp.astimezone(eat_timezone)
            return eat_time.isoformat()
        
        # Convert row to dictionary with timezone conversion
        raw_device_dict = {}
        for column, value in device_row._mapping.items():
            raw_device_dict[column] = value
            
        # Process data with timezone conversion
        device_dict = {}
        for key, value in raw_device_dict.items():
            if value is None:
                device_dict[key] = None
                continue
                
            # Handle different types
            try:
                # Try to convert to float
                float_val = float(value)
                if float_val != float_val:  # NaN check
                    device_dict[key] = None
                else:
                    device_dict[key] = float_val
            except (TypeError, ValueError):
                # If conversion to float fails, check for datetime
                try:
                    if hasattr(value, 'isoformat'):
                        # Convert datetime to EAT
                        device_dict[key] = convert_to_eat(value)
                    else:
                        device_dict[key] = str(value)
                except:
                    device_dict[key] = str(value)
        
        # Get maintenance history
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
        
        history_result = db.execute(maintenance_history_query, {"device_key": raw_device_dict.get('device_key')})
        maintenance_history = []
        
        for row in history_result:
            raw_history_dict = {}
            for column, value in row._mapping.items():
                raw_history_dict[column] = value
                
            history_dict = {}
            for key, value in raw_history_dict.items():
                if value is None:
                    history_dict[key] = None
                    continue
                    
                try:
                    float_val = float(value)
                    if float_val != float_val:
                        history_dict[key] = None
                    else:
                        history_dict[key] = float_val
                except (TypeError, ValueError):
                    try:
                        if hasattr(value, 'isoformat'):
                            # Convert datetime to EAT
                            history_dict[key] = convert_to_eat(value)
                        else:
                            history_dict[key] = str(value)
                    except:
                        history_dict[key] = str(value)
                        
            maintenance_history.append(history_dict)
        
        # Get all readings history (no LIMIT)
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
        """)
        
        readings_result = db.execute(readings_history_query, {"device_key": raw_device_dict.get('device_key')})
        readings_history = []
        
        for row in readings_result:
            raw_reading_dict = {}
            for column, value in row._mapping.items():
                raw_reading_dict[column] = value
                
            reading_dict = {}
            for key, value in raw_reading_dict.items():
                if value is None:
                    reading_dict[key] = None
                    continue
                    
                try:
                    float_val = float(value)
                    if float_val != float_val:
                        reading_dict[key] = None
                    else:
                        reading_dict[key] = float_val
                except (TypeError, ValueError):
                    try:
                        if hasattr(value, 'isoformat'):
                            # Convert datetime to EAT
                            reading_dict[key] = convert_to_eat(value)
                        else:
                            reading_dict[key] = str(value)
                    except:
                        reading_dict[key] = str(value)
                        
            readings_history.append(reading_dict)
        
        # Structure the response with null checks
        response = {
            "device": {
                "id": str(device_dict.get("device_id", "")) if device_dict.get("device_id") is not None else None,
                "name": str(device_dict.get("device_name", "")) if device_dict.get("device_name") is not None else None,
                "status": str(device_dict.get("status", "")) if device_dict.get("status") is not None else None,
                "is_online": device_dict.get("current_is_online"),
                "network": str(device_dict.get("network", "")) if device_dict.get("network") is not None else None,
                "category": str(device_dict.get("category", "")) if device_dict.get("category") is not None else None,
                "is_active": device_dict.get("is_active"),
                "mount_type": str(device_dict.get("mount_type", "")) if device_dict.get("mount_type") is not None else None,
                "power_type": str(device_dict.get("power_type", "")) if device_dict.get("power_type") is not None else None,
                "height": device_dict.get("height"),
                "next_maintenance": device_dict.get("next_maintenance"),
                "first_seen": device_dict.get("first_seen"),
                "last_updated": device_dict.get("last_updated")
            },
            "location": {
                "latitude": device_dict.get("latitude"),
                "longitude": device_dict.get("longitude"),
                "name": str(device_dict.get("location_name", "")) if device_dict.get("location_name") is not None else 
                        (str(device_dict.get("full_location_name", "")) if device_dict.get("full_location_name") is not None else None),
                "country": str(device_dict.get("admin_level_country", "")) if device_dict.get("admin_level_country") is not None else 
                           (str(device_dict.get("country", "")) if device_dict.get("country") is not None else None),
                "city": str(device_dict.get("admin_level_city", "")) if device_dict.get("admin_level_city") is not None else 
                        (str(device_dict.get("city", "")) if device_dict.get("city") is not None else None),
                "division": str(device_dict.get("admin_level_division", "")) if device_dict.get("admin_level_division") is not None else None,
                "village": str(device_dict.get("village", "")) if device_dict.get("village") is not None else 
                           (str(device_dict.get("full_village", "")) if device_dict.get("full_village") is not None else None),
                "deployment_date": device_dict.get("deployment_date")
            },
            "site": {
                "id": str(device_dict.get("site_id", "")) if device_dict.get("site_id") is not None else None,
                "name": str(device_dict.get("site_name", "")) if device_dict.get("site_name") is not None else 
                        (str(device_dict.get("full_site_name", "")) if device_dict.get("full_site_name") is not None else None),
                "category": str(device_dict.get("site_category", "")) if device_dict.get("site_category") is not None else 
                            (str(device_dict.get("full_site_category", "")) if device_dict.get("full_site_category") is not None else None),
                "data_provider": str(device_dict.get("data_provider", "")) if device_dict.get("data_provider") is not None else None
            },
            "latest_reading": {
                "timestamp": device_dict.get("reading_timestamp"),
                "pm2_5": device_dict.get("pm2_5"),
                "pm10": device_dict.get("pm10"),
                "no2": device_dict.get("no2"),
                "aqi_category": str(device_dict.get("aqi_category", "")) if device_dict.get("aqi_category") is not None else None,
                "aqi_color": str(device_dict.get("aqi_color", "")) if device_dict.get("aqi_color") is not None else None
            },
            "maintenance_history": maintenance_history,
            "readings_history": readings_history,
            "timezone": "Africa/Kampala (EAT)"  # Added to indicate timezone used
        }
        
        # Custom JSON encoder for any remaining datetime objects
        def safe_json_encoder(obj):
            try:
                json.dumps(obj)
                return obj
            except:
                try:
                    if hasattr(obj, 'isoformat'):
                        # Convert datetime to EAT
                        return convert_to_eat(obj)
                    return str(obj)
                except:
                    return None
        
        # Convert to JSON with custom encoder
        json_str = json.dumps(response, default=safe_json_encoder)
        safe_response = json.loads(json_str)
        
        return safe_response
        
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
            # Direct conversion without using convert_to_json_serializable
            raw_tip_dict = {}
            for column, value in row._mapping.items():
                raw_tip_dict[column] = value
            
            # Process the tip data safely
            tip_dict = {}
            for key, value in raw_tip_dict.items():
                if value is None:
                    tip_dict[key] = None
                    continue
                
                # Handle different types without using isinstance
                try:
                    # Try to convert to float (for numeric types)
                    float_val = float(value)
                    # Check if NaN
                    if float_val != float_val:  # Simple NaN check
                        tip_dict[key] = None
                    else:
                        tip_dict[key] = float_val
                except (TypeError, ValueError):
                    # For non-numeric types (strings, dates, etc.)
                    try:
                        if hasattr(value, 'isoformat'):
                            tip_dict[key] = value.isoformat()
                        else:
                            tip_dict[key] = str(value)
                    except:
                        tip_dict[key] = str(value)
            
            tips.append(tip_dict)
        
        if not tips:
            # No tips found for this specific reading_key
            # Return a default set of health tips based on AQI category
            default_tips = get_default_health_tips(aqi_category)
            return {"tips": default_tips, "aqi_category": aqi_category}
        
        return {"tips": tips, "aqi_category": aqi_category}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching health tips by device: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch health tips: {str(e)}")

# Helper function to get default health tips based on AQI category
def get_default_health_tips(aqi_category):
    # Provide default health tips based on AQI category
    if not aqi_category or aqi_category == "Unknown":
        return [
            {
                "tip_id": "default-1",
                "title": "Air Quality Information",
                "description": "Stay informed about local air quality conditions through the AirQo app or website."
            }
        ]
    
    if aqi_category == "Good":
        return [
            {
                "tip_id": "good-1",
                "title": "Enjoy Outdoor Activities",
                "description": "Air quality is good! This is a great time for outdoor activities."
            },
            {
                "tip_id": "good-2",
                "title": "Open Windows",
                "description": "Take advantage of the clean air by opening windows to ventilate your home."
            }
        ]
    
    if aqi_category == "Moderate":
        return [
            {
                "tip_id": "moderate-1",
                "title": "Sensitive Groups Should Take Precautions",
                "description": "If you have respiratory issues, consider reducing prolonged outdoor exertion."
            },
            {
                "tip_id": "moderate-2",
                "title": "Stay Hydrated",
                "description": "Drink plenty of water to help your body process pollutants more effectively."
            }
        ]
    
    # For Unhealthy categories
    return [
        {
            "tip_id": "unhealthy-1",
            "title": "Limit Outdoor Activities",
            "description": "Reduce time spent outdoors, especially near high-traffic areas."
        },
        {
            "tip_id": "unhealthy-2",
            "title": "Use Air Purifiers",
            "description": "If available, use air purifiers indoors to improve indoor air quality."
        },
        {
            "tip_id": "unhealthy-3",
            "title": "Wear a Mask",
            "description": "Consider wearing an N95 mask when outdoors if air quality is poor."
        }
    ]


@app.get("/devices-detail")
def get_all_devices_detail(db=Depends(get_db)):
    try:
        # Complex query joining multiple tables to get comprehensive device information
        # Same as the device-detail endpoint but without the device_id filter
        # Added condition to only show deployed devices (is_active = true)
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
            WHERE d.is_active = true  -- Only show deployed devices
        """)
        
        result = db.execute(query)
        
        # Get the EAT timezone
        eat_timezone = tz.gettz('Africa/Kampala')
        
        # Function to convert timestamps to EAT
        def convert_to_eat(timestamp):
            if timestamp is None:
                return None
                
            # If timestamp has no timezone info, assume it's UTC
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
                
            # Convert to EAT timezone
            eat_time = timestamp.astimezone(eat_timezone)
            return eat_time.isoformat()
        
        # Process results
        all_devices = []
        
        for device_row in result:
            # Convert row to dictionary with timezone conversion
            raw_device_dict = {}
            for column, value in device_row._mapping.items():
                raw_device_dict[column] = value
                
            # Process data with timezone conversion
            device_dict = {}
            for key, value in raw_device_dict.items():
                if value is None:
                    device_dict[key] = None
                    continue
                    
                # Handle different types
                try:
                    # Try to convert to float
                    float_val = float(value)
                    if float_val != float_val:  # NaN check
                        device_dict[key] = None
                    else:
                        device_dict[key] = float_val
                except (TypeError, ValueError):
                    # If conversion to float fails, check for datetime
                    try:
                        if hasattr(value, 'isoformat'):
                            # Convert datetime to EAT
                            device_dict[key] = convert_to_eat(value)
                        else:
                            device_dict[key] = str(value)
                    except:
                        device_dict[key] = str(value)
            
            # Get maintenance history for this device without limit
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
            """)
            
            history_result = db.execute(maintenance_history_query, {"device_key": raw_device_dict.get('device_key')})
            maintenance_history = []
            
            for row in history_result:
                raw_history_dict = {}
                for column, value in row._mapping.items():
                    raw_history_dict[column] = value
                    
                history_dict = {}
                for key, value in raw_history_dict.items():
                    if value is None:
                        history_dict[key] = None
                        continue
                        
                    try:
                        float_val = float(value)
                        if float_val != float_val:
                            history_dict[key] = None
                        else:
                            history_dict[key] = float_val
                    except (TypeError, ValueError):
                        try:
                            if hasattr(value, 'isoformat'):
                                # Convert datetime to EAT
                                history_dict[key] = convert_to_eat(value)
                            else:
                                history_dict[key] = str(value)
                        except:
                            history_dict[key] = str(value)
                            
                maintenance_history.append(history_dict)
            
            # Get readings history for this device without limit
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
            """)
            
            readings_result = db.execute(readings_history_query, {"device_key": raw_device_dict.get('device_key')})
            readings_history = []
            
            for row in readings_result:
                raw_reading_dict = {}
                for column, value in row._mapping.items():
                    raw_reading_dict[column] = value
                    
                reading_dict = {}
                for key, value in raw_reading_dict.items():
                    if value is None:
                        reading_dict[key] = None
                        continue
                        
                    try:
                        float_val = float(value)
                        if float_val != float_val:
                            reading_dict[key] = None
                        else:
                            reading_dict[key] = float_val
                    except (TypeError, ValueError):
                        try:
                            if hasattr(value, 'isoformat'):
                                # Convert datetime to EAT
                                reading_dict[key] = convert_to_eat(value)
                            else:
                                reading_dict[key] = str(value)
                        except:
                            reading_dict[key] = str(value)
                            
                readings_history.append(reading_dict)
            
            # Structure the response with null checks
            device_response = {
                "device": {
                    "id": str(device_dict.get("device_id", "")) if device_dict.get("device_id") is not None else None,
                    "name": str(device_dict.get("device_name", "")) if device_dict.get("device_name") is not None else None,
                    "status": str(device_dict.get("status", "")) if device_dict.get("status") is not None else None,
                    "is_online": device_dict.get("current_is_online"),
                    "network": str(device_dict.get("network", "")) if device_dict.get("network") is not None else None,
                    "category": str(device_dict.get("category", "")) if device_dict.get("category") is not None else None,
                    "is_active": device_dict.get("is_active"),
                    "mount_type": str(device_dict.get("mount_type", "")) if device_dict.get("mount_type") is not None else None,
                    "power_type": str(device_dict.get("power_type", "")) if device_dict.get("power_type") is not None else None,
                    "height": device_dict.get("height"),
                    "next_maintenance": device_dict.get("next_maintenance"),
                    "first_seen": device_dict.get("first_seen"),
                    "last_updated": device_dict.get("last_updated")
                },
                "location": {
                    "latitude": device_dict.get("latitude"),
                    "longitude": device_dict.get("longitude"),
                    "name": str(device_dict.get("location_name", "")) if device_dict.get("location_name") is not None else 
                            (str(device_dict.get("full_location_name", "")) if device_dict.get("full_location_name") is not None else None),
                    "country": str(device_dict.get("admin_level_country", "")) if device_dict.get("admin_level_country") is not None else 
                            (str(device_dict.get("country", "")) if device_dict.get("country") is not None else None),
                    "city": str(device_dict.get("admin_level_city", "")) if device_dict.get("admin_level_city") is not None else 
                            (str(device_dict.get("city", "")) if device_dict.get("city") is not None else None),
                    "division": str(device_dict.get("admin_level_division", "")) if device_dict.get("admin_level_division") is not None else None,
                    "village": str(device_dict.get("village", "")) if device_dict.get("village") is not None else 
                            (str(device_dict.get("full_village", "")) if device_dict.get("full_village") is not None else None),
                    "deployment_date": device_dict.get("deployment_date")
                },
                "site": {
                    "id": str(device_dict.get("site_id", "")) if device_dict.get("site_id") is not None else None,
                    "name": str(device_dict.get("site_name", "")) if device_dict.get("site_name") is not None else 
                            (str(device_dict.get("full_site_name", "")) if device_dict.get("full_site_name") is not None else None),
                    "category": str(device_dict.get("site_category", "")) if device_dict.get("site_category") is not None else 
                                (str(device_dict.get("full_site_category", "")) if device_dict.get("full_site_category") is not None else None),
                    "data_provider": str(device_dict.get("data_provider", "")) if device_dict.get("data_provider") is not None else None
                },
                "latest_reading": {
                    "timestamp": device_dict.get("reading_timestamp"),
                    "pm2_5": device_dict.get("pm2_5"),
                    "pm10": device_dict.get("pm10"),
                    "no2": device_dict.get("no2"),
                    "aqi_category": str(device_dict.get("aqi_category", "")) if device_dict.get("aqi_category") is not None else None,
                    "aqi_color": str(device_dict.get("aqi_color", "")) if device_dict.get("aqi_color") is not None else None
                },
                "maintenance_history": maintenance_history,
                "readings_history": readings_history,
            }
            
            all_devices.append(device_response)
        
        # Custom JSON encoder for any remaining datetime objects
        def safe_json_encoder(obj):
            try:
                json.dumps(obj)
                return obj
            except:
                try:
                    if hasattr(obj, 'isoformat'):
                        # Convert datetime to EAT
                        return convert_to_eat(obj)
                    return str(obj)
                except:
                    return None
        
        # Create response object
        response = {
            "devices": all_devices,
            "count": len(all_devices),
            "timezone": "Africa/Kampala (EAT)"
        }
        
        # Convert to JSON with custom encoder
        json_str = json.dumps(response, default=safe_json_encoder)
        safe_response = json.loads(json_str)
        
        return safe_response
        
    except Exception as e:
        print(f"Error in get_all_devices_detail: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch all device details: {str(e)}")


@app.get("/device-monitoring-metrics")
def get_device_monitoring_metrics(db=Depends(get_db)):
    try:
        # Query to get region and country summary metrics
        region_country_query = text("""
            WITH region_counts AS (
                SELECT 
                    admin_level_country as country_name,
                    COUNT(DISTINCT l.device_key) as device_count,
                    COUNT(DISTINCT admin_level_division) as district_count,
                    SUM(CASE WHEN d.is_active = true THEN 1 ELSE 0 END) as active_devices,
                    -- Group countries into regions
                    CASE
                        WHEN admin_level_country IN ('Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan') THEN 'East Africa'
                        WHEN admin_level_country IN ('Nigeria', 'Ghana', 'Senegal', 'Ivory Coast', 'Cameroon') THEN 'West Africa'
                        WHEN admin_level_country IN ('South Africa', 'Botswana', 'Zimbabwe', 'Zambia', 'Mozambique') THEN 'Southern Africa'
                        WHEN admin_level_country IN ('Egypt', 'Morocco', 'Tunisia', 'Algeria', 'Libya') THEN 'North Africa'
                        WHEN admin_level_country IN ('DR Congo', 'Chad', 'Central African Republic', 'Gabon') THEN 'Central Africa'
                        ELSE 'Other'
                    END as region
                FROM dim_location l
                JOIN dim_device d ON l.device_key = d.device_key
                WHERE l.is_active = true AND admin_level_country IS NOT NULL
                GROUP BY admin_level_country
            ),
            region_summary AS (
                SELECT 
                    region,
                    COUNT(DISTINCT country_name) as country_count,
                    SUM(device_count) as total_devices,
                    SUM(district_count) as total_districts
                FROM region_counts
                GROUP BY region
            )
            SELECT 
                COUNT(DISTINCT region) as total_regions,
                SUM(total_devices) as total_devices,
                SUM(country_count) as total_countries,
                SUM(total_districts) as total_districts
            FROM region_summary
        """)
        
        region_country_result = db.execute(region_country_query).fetchone()
        
        # Query to get device status metrics
        device_status_query = text("""
            WITH latest_device_status AS (
                SELECT DISTINCT ON (s.device_key)
                    s.device_key,
                    s.is_online,
                    s.device_status
                FROM fact_device_status s
                JOIN dim_device d ON s.device_key = d.device_key
                WHERE d.is_active = true
                ORDER BY s.device_key, s.timestamp DESC
            )
            SELECT
                COUNT(*) as total_active_devices,
                SUM(CASE WHEN is_online = true THEN 1 ELSE 0 END) as online_devices,
                SUM(CASE WHEN is_online = false THEN 1 ELSE 0 END) as offline_devices
            FROM latest_device_status
        """)
        
        device_status_result = db.execute(device_status_query).fetchone()
        
        # Query to get district metrics
        district_query = text("""
            SELECT
                COUNT(DISTINCT CASE WHEN admin_level_division IS NOT NULL THEN admin_level_division END) as total_districts,
                COUNT(DISTINCT CASE WHEN d.is_active = true AND admin_level_division IS NOT NULL THEN admin_level_division END) as districts_with_devices
            FROM dim_location l
            JOIN dim_device d ON l.device_key = d.device_key
        """)
        
        district_result = db.execute(district_query).fetchone()
        
        # Format the response
        response = {
            "regions": {
                "count": region_country_result.total_regions if region_country_result else 0,
                "devices": region_country_result.total_devices if region_country_result else 0
            },
            "countries": {
                "count": region_country_result.total_countries if region_country_result else 0,
                "devices": region_country_result.total_devices if region_country_result else 0
            },
            "districts": {
                "total": district_result.total_districts if district_result else 0,
                "with_devices": district_result.districts_with_devices if district_result else 0
            },
            "devices": {
                "total": device_status_result.total_active_devices if device_status_result else 0,
                "online": device_status_result.online_devices if device_status_result else 0,
                "offline": device_status_result.offline_devices if device_status_result else 0
            }
        }
        
        return response
        
    except Exception as e:
        print(f"Error in get_device_monitoring_metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch device monitoring metrics: {str(e)}")
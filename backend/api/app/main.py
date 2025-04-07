from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import List, Optional
from pydantic import BaseModel
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

# Pydantic models
class Device(BaseModel):
    device_key: int
    device_id: str
    device_name: str
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
    
    class Config:
        orm_mode = True

class DeviceCount(BaseModel):
    total_devices: int
    active_devices: int
    offline_devices: int
    deployed_devices: int 
    not_deployed: int
    recalled_devices: int

# Endpoint to get all devices
@app.get("/devices", response_model=List[Device])
def get_all_devices(db=Depends(get_db)):
    try:
        result = db.execute(text("SELECT * FROM dim_device"))
        devices = [dict(row._mapping) for row in result]
        return devices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch devices: {str(e)}")

# Endpoint to get a specific device by ID
@app.get("/devices/{device_id}", response_model=Device)
def get_device(device_id: str, db=Depends(get_db)):
    try:
        result = db.execute(
            text("SELECT * FROM dim_device WHERE device_id = :device_id"),
            {"device_id": device_id}
        )
        device = result.first()
        
        if not device:
            raise HTTPException(status_code=404, detail=f"Device with ID {device_id} not found")
        
        return dict(device._mapping)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch device: {str(e)}")

# Endpoint to get device counts for dashboard
@app.get("/device-counts", response_model=DeviceCount)
def get_device_counts(db=Depends(get_db)):
    try:
        # Get total devices
        total_result = db.execute(text("SELECT COUNT(*) FROM dim_device"))
        total_devices = total_result.scalar()
        
        # Get active devices (is_active = true)
        active_result = db.execute(text("SELECT COUNT(*) FROM dim_device WHERE is_active = true"))
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch device counts: {str(e)}")
# Endpoint to get device status statistics
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
        
        status_counts = [dict(row._mapping) for row in result]
        return status_counts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch device status: {str(e)}")
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json

from app.database import get_db
from app.utils import create_json_response

# Create router for data transmission analytics
router = APIRouter(prefix="/api/analytics", tags=["data-analytics"])

@router.get("/device-transmission")
def get_device_transmission(
    timeRange: str = Query("7days", description="Time range: 7days, 30days, 90days, or year"),
    db: Session = Depends(get_db)
):
    """
    Get data transmission status by device over time.
    Returns a time series showing when devices successfully transmitted data.
    """
    try:
        # Calculate date range based on timeRange parameter
        end_date = datetime.utcnow()
        if timeRange == "7days":
            start_date = end_date - timedelta(days=7)
        elif timeRange == "30days":
            start_date = end_date - timedelta(days=30)
        elif timeRange == "90days":
            start_date = end_date - timedelta(days=90)
        elif timeRange == "year":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=7)
        
        # Query to get device transmission data with proper format
        query = text("""
            WITH date_series AS (
                SELECT generate_series(
                    DATE_TRUNC('day', CAST(:start_date AS TIMESTAMP))::date,
                    DATE_TRUNC('day', CAST(:end_date AS TIMESTAMP))::date,
                    INTERVAL '1 day'
                ) AS date
            ),
            active_devices AS (
                SELECT DISTINCT device_id, device_key, device_name
                FROM dim_device
                WHERE is_active = true AND status = 'deployed'
            ),
            device_readings AS (
                SELECT 
                    DATE_TRUNC('day', r.timestamp)::date AS reading_date,
                    d.device_id,
                    d.device_name,
                    COUNT(r.reading_key) AS reading_count
                FROM dim_device d
                JOIN fact_device_readings r ON d.device_key = r.device_key
                WHERE r.timestamp BETWEEN CAST(:start_date AS TIMESTAMP) AND CAST(:end_date AS TIMESTAMP)
                GROUP BY DATE_TRUNC('day', r.timestamp)::date, d.device_id, d.device_name
            )
            SELECT 
                ds.date::text AS date,
                json_object_agg(
                    ad.device_id, 
                    CASE 
                        WHEN dr.reading_count > 0 THEN 100 
                        ELSE 0 
                    END
                ) AS device_data
            FROM date_series ds
            CROSS JOIN active_devices ad
            LEFT JOIN device_readings dr 
                ON dr.reading_date = ds.date
                AND dr.device_id = ad.device_id
            GROUP BY ds.date
            ORDER BY ds.date;
        """)
        
        result = db.execute(query, {"start_date": start_date, "end_date": end_date}).fetchall()
        
        # Process the results into a format suitable for the frontend chart
        transmission_data = []
        for row in result:
            date_str = row[0]
            device_data = row[1] if row[1] else {}
            
            # Create a row with the date and device values
            row_data = {"date": date_str}
            
            # Add device data
            if isinstance(device_data, dict):
                for device_id, value in device_data.items():
                    row_data[device_id] = value
            
            transmission_data.append(row_data)
        
        return create_json_response(transmission_data)
    
    except Exception as e:
        print(f"Error in get_device_transmission: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch device transmission data: {str(e)}")

@router.get("/data-volume")
def get_data_volume(
    timeRange: str = Query("7days", description="Time range: 7days, 30days, 90days, or year"),
    db: Session = Depends(get_db)
):
    try:
        # Use the same calculation approach as device-transmission
        end_date = datetime.utcnow()
        if timeRange == "7days":
            start_date = end_date - timedelta(days=7)
        elif timeRange == "30days":
            start_date = end_date - timedelta(days=30)
        elif timeRange == "90days":
            start_date = end_date - timedelta(days=90)
        elif timeRange == "year":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=7)
            
        # Determine the interval in days for grouping
        if timeRange == "7days" or timeRange == "30days":
            interval_days = 1  # Daily
        elif timeRange == "90days":
            interval_days = 7  # Weekly
        elif timeRange == "year":
            interval_days = 30  # Monthly
        else:
            interval_days = 1  # Default to daily

        query = text("""
            WITH date_series AS (
                SELECT generate_series(
                    DATE_TRUNC('day', CAST(:start_date AS TIMESTAMP))::date,
                    DATE_TRUNC('day', CAST(:end_date AS TIMESTAMP))::date,
                    CAST(:interval_days || ' days' AS INTERVAL)
                ) AS date
            ),
            active_devices_per_day AS (
                SELECT 
                    DATE_TRUNC('day', timestamp)::date AS date,
                    COUNT(DISTINCT device_key) AS active_devices
                FROM fact_device_readings
                WHERE timestamp BETWEEN CAST(:start_date AS TIMESTAMP) AND CAST(:end_date AS TIMESTAMP)
                GROUP BY DATE_TRUNC('day', timestamp)::date
            ),
            total_devices AS (
                SELECT COUNT(*) AS count
                FROM dim_device
                WHERE is_active = true AND status = 'deployed'
            ),
            readings_per_day AS (
                SELECT 
                    DATE_TRUNC('day', timestamp)::date AS date,
                    COUNT(*) AS reading_count
                FROM fact_device_readings
                WHERE timestamp BETWEEN CAST(:start_date AS TIMESTAMP) AND CAST(:end_date AS TIMESTAMP)
                GROUP BY DATE_TRUNC('day', timestamp)::date
            )
            SELECT 
                ds.date::text AS date,
                COALESCE(SUM(rpd.reading_count), 0) AS dataVolume,
                (SELECT count FROM total_devices) * 24 * :interval_days * 12 AS expectedVolume,
                COALESCE(COUNT(DISTINCT adpd.active_devices), 0) AS devices
            FROM date_series ds
            LEFT JOIN readings_per_day rpd 
                ON rpd.date BETWEEN ds.date AND ds.date + CAST(:interval_days || ' days' AS INTERVAL) - INTERVAL '1 day'
            LEFT JOIN active_devices_per_day adpd 
                ON adpd.date BETWEEN ds.date AND ds.date + CAST(:interval_days || ' days' AS INTERVAL) - INTERVAL '1 day'
            GROUP BY ds.date, (SELECT count FROM total_devices)
            ORDER BY ds.date
        """)

        result = db.execute(query, {
            "start_date": start_date,
            "end_date": end_date,
            "interval_days": interval_days
        }).fetchall()

        volume_data = []
        for row in result:
            volume_data.append({
                "date": row[0],
                "dataVolume": row[1],
                "expectedVolume": row[2],
                "devices": row[3]
            })
        
        return create_json_response(volume_data)
    
    except Exception as e:
        print(f"Error in get_data_volume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch data volume metrics: {str(e)}")

@router.get("/hourly-transmission")
def get_hourly_transmission(db: Session = Depends(get_db)):
    """
    Get hourly data transmission patterns.
    Returns data volume and active device count by hour of day.
    """
    try:
        # Using a different approach to avoid the parameter binding issue with ':00'
        # The parameter binding is interpreting the colon in ':00' as a parameter
        query = text("""
            SELECT 
                CONCAT(LPAD(EXTRACT(HOUR FROM timestamp)::text, 2, '0'), ' hours') AS hour_display,
                COUNT(*) AS data_volume,
                COUNT(DISTINCT device_key) AS device_count
            FROM fact_device_readings
            WHERE timestamp >= NOW() - INTERVAL '7 days'
            GROUP BY EXTRACT(HOUR FROM timestamp)
            ORDER BY EXTRACT(HOUR FROM timestamp)
        """)
        
        result = db.execute(query).fetchall()
        
        # Process the results and format the hour string in Python instead of SQL
        hourly_data = []
        for row in result:
            # The hour comes out as "XX hours", we'll reformat it to "XX:00"
            hour_str = row[0].replace(' hours', ':00')
            
            hourly_data.append({
                "hour": hour_str,
                "dataVolume": row[1],
                "devices": row[2]
            })
        
        return create_json_response(hourly_data)
    
    except Exception as e:
        print(f"Error in get_hourly_transmission: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch hourly transmission data: {str(e)}")    

@router.get("/device-failures")
def get_device_failures(
    timeRange: str = Query("7days", description="Time range: 7days, 30days, 90days, or year"),
    db: Session = Depends(get_db)
):
    """
    Get detailed device failure analysis showing specific transmission failures.
    Detects actual instances of transmission failures by day for each device.
    """
    try:
        # Calculate date range based on timeRange parameter
        end_date = datetime.utcnow()
        if timeRange == "7days":
            start_date = end_date - timedelta(days=7)
        elif timeRange == "30days":
            start_date = end_date - timedelta(days=30)
        elif timeRange == "90days":
            start_date = end_date - timedelta(days=90)
        elif timeRange == "year":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=7)
        
        # Query to identify active devices with transmission data
        active_devices_query = text("""
            SELECT 
                device_key, device_id, device_name
            FROM dim_device
            WHERE is_active = true AND status = 'deployed'
        """)
        
        active_devices = db.execute(active_devices_query).fetchall()
        
        # Check if we have active devices
        if not active_devices:
            return create_json_response([])
        
        # For each active device, analyze transmission patterns by day
        failure_data = []
        
        for device in active_devices:
            device_key = device[0]
            device_id = device[1]
            device_name = device[2]
            
            # Get transmission data for this device by day
            transmission_query = text("""
                WITH date_series AS (
                    SELECT generate_series(
                        DATE_TRUNC('day', CAST(:start_date AS TIMESTAMP))::date,
                        DATE_TRUNC('day', CAST(:end_date AS TIMESTAMP))::date,
                        INTERVAL '1 day'
                    ) AS date
                ),
                device_readings AS (
                    SELECT 
                        DATE_TRUNC('day', timestamp)::date AS reading_day,
                        COUNT(*) AS reading_count
                    FROM fact_device_readings
                    WHERE device_key = :device_key
                    AND timestamp BETWEEN CAST(:start_date AS TIMESTAMP) AND CAST(:end_date AS TIMESTAMP)
                    GROUP BY DATE_TRUNC('day', timestamp)::date
                )
                SELECT
                    ds.date AS day,
                    COALESCE(dr.reading_count, 0) AS readings
                FROM date_series ds
                LEFT JOIN device_readings dr ON ds.date = dr.reading_day
                ORDER BY ds.date
            """)
            
            transmission_data = db.execute(
                transmission_query, 
                {
                    "device_key": device_key,
                    "start_date": start_date,
                    "end_date": end_date
                }
            ).fetchall()
            
            # Calculate failures and missing days
            total_days = len(transmission_data)
            failure_days = sum(1 for day in transmission_data if day[1] == 0)
            uptime_pct = ((total_days - failure_days) / total_days) * 100 if total_days > 0 else 0
            
            # Get specific dates with failures for more detailed status
            failure_dates = [day[0].strftime("%Y-%m-%d") for day in transmission_data if day[1] == 0]
            
            # Create status message with specific dates if there aren't too many
            if failure_days == 0:
                status_msg = "No failures"
            elif failure_days == 1:
                status_msg = f"Failed on {failure_dates[0]}"
            elif failure_days <= 3:
                status_msg = f"Failed on {', '.join(failure_dates)}"
            else:
                recent_failures = failure_dates[-3:]
                status_msg = f"{failure_days} failures (most recent: {', '.join(recent_failures)})"
            
            # Add device to results if it has at least one failure or if we want to show all devices
            if failure_days > 0:  # Only include devices with failures
                failure_data.append({
                    "device": device_id,
                    "name": device_name,
                    "failures": failure_days,
                    "uptime": uptime_pct,
                    "status": status_msg,
                    "failure_dates": failure_dates
                })
        
        # Sort by number of failures (most failures first)
        failure_data.sort(key=lambda x: x["failures"], reverse=True)
        
        # Limit to top 10 devices with most failures
        return create_json_response(failure_data[:10])
    
    except Exception as e:
        print(f"Error in get_device_failures: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch device failure data: {str(e)}")
    
# Register the router function
def register_with_app(app):
    """Register the data analytics router with the FastAPI application"""
    app.include_router(router)
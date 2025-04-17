from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Optional
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
        # Determine time interval
        end_date = datetime.now()
        if timeRange == "7days":
            start_date = end_date - timedelta(days=7)
            interval = "day"
        elif timeRange == "30days":
            start_date = end_date - timedelta(days=30)
            interval = "day"
        elif timeRange == "90days":
            start_date = end_date - timedelta(days=90)
            interval = "week"
        elif timeRange == "year":
            start_date = end_date - timedelta(days=365)
            interval = "month"
        else:
            start_date = end_date - timedelta(days=7)
            interval = "day"

        query = text(f"""
            WITH date_series AS (
                SELECT generate_series(
                    DATE_TRUNC('{interval}', CAST(:start_date AS TIMESTAMP))::date,
                    DATE_TRUNC('{interval}', CAST(:end_date AS TIMESTAMP))::date,
                    INTERVAL '1 {interval}'
                ) AS date
            ),
            active_devices AS (
                SELECT DISTINCT device_id
                FROM dim_device
                WHERE is_active = true AND status = 'deployed'
            ),
            device_transmission AS (
                SELECT 
                    DATE_TRUNC('{interval}', r.timestamp)::date AS date,
                    d.device_id,
                    COUNT(r.reading_key) > 0 AS has_data
                FROM dim_device d
                CROSS JOIN date_series ds
                LEFT JOIN fact_device_readings r 
                    ON d.device_key = r.device_key 
                    AND DATE_TRUNC('{interval}', r.timestamp)::date = ds.date
                WHERE d.device_id IN (SELECT device_id FROM active_devices)
                GROUP BY d.device_id, DATE_TRUNC('{interval}', r.timestamp)::date, ds.date
            )
            SELECT 
                ds.date::text,
                json_object_agg(
                    dt.device_id, 
                    CASE WHEN dt.has_data THEN 100 ELSE 0 END
                ) FILTER (WHERE dt.device_id IS NOT NULL) AS device_data
            FROM date_series ds
            CROSS JOIN active_devices ad
            LEFT JOIN device_transmission dt 
                ON ds.date = dt.date AND ad.device_id = dt.device_id
            GROUP BY ds.date
            ORDER BY ds.date;
        """)

        result = db.execute(query, {
            "start_date": start_date,
            "end_date": end_date
        })

        transmission_data = []
        for row in result:
            date_str = row[0]
            device_data = row[1] or {}
            row_data = {"date": date_str}
            if isinstance(device_data, dict):
                row_data.update(device_data)
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
    """
    Get data volume metrics over time.
    Returns actual vs expected data volume and active device counts.
    """
    try:
        # Calculate date range based on timeRange parameter
        end_date = datetime.now()
        if timeRange == "7days":
            start_date = end_date - timedelta(days=7)
            interval = "day"
        elif timeRange == "30days":
            start_date = end_date - timedelta(days=30)
            interval = "day"
        elif timeRange == "90days":
            start_date = end_date - timedelta(days=90) 
            interval = "week"
        elif timeRange == "year":
            start_date = end_date - timedelta(days=365)
            interval = "month"
        else:
            start_date = end_date - timedelta(days=7)
            interval = "day"
        
        # Query to get data volume metrics
        query = text("""
            WITH date_series AS (
                SELECT 
                    generate_series(
                        DATE_TRUNC(:interval, :start_date::timestamp)::date,
                        DATE_TRUNC(:interval, :end_date::timestamp)::date,
                        ('1 ' || :interval)::interval
                    ) AS date
            ),
            active_devices_per_day AS (
                SELECT 
                    DATE_TRUNC(:interval, timestamp)::date AS date,
                    COUNT(DISTINCT device_key) AS active_devices
                FROM fact_device_readings
                WHERE timestamp BETWEEN :start_date AND :end_date
                GROUP BY DATE_TRUNC(:interval, timestamp)::date
            ),
            total_devices AS (
                SELECT COUNT(*) AS count
                FROM dim_device
                WHERE is_active = true AND status = 'deployed'
            ),
            readings_per_day AS (
                SELECT 
                    DATE_TRUNC(:interval, timestamp)::date AS date,
                    COUNT(*) AS reading_count
                FROM fact_device_readings
                WHERE timestamp BETWEEN :start_date AND :end_date
                GROUP BY DATE_TRUNC(:interval, timestamp)::date
            )
            SELECT 
                ds.date::text AS date,
                COALESCE(rpd.reading_count, 0) AS dataVolume,
                CASE 
                    WHEN :interval = 'day' THEN td.count * 24 * 12 -- Hourly readings (12 per hour)
                    WHEN :interval = 'week' THEN td.count * 24 * 7 * 12 -- Weekly
                    WHEN :interval = 'month' THEN td.count * 24 * 30 * 12 -- Monthly (approx)
                END AS expectedVolume,
                COALESCE(adpd.active_devices, 0) AS devices
            FROM date_series ds
            CROSS JOIN total_devices td
            LEFT JOIN readings_per_day rpd ON ds.date = rpd.date
            LEFT JOIN active_devices_per_day adpd ON ds.date = adpd.date
            ORDER BY ds.date
        """)
        
        result = db.execute(
            query, 
            {
                "start_date": start_date, 
                "end_date": end_date,
                "interval": interval
            }
        )
        
        # Process the results
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
        # Query for hourly data patterns over the last 7 days
        query = text("""
            WITH hourly_data AS (
                SELECT 
                    EXTRACT(HOUR FROM timestamp) AS hour,
                    COUNT(*) AS data_count,
                    COUNT(DISTINCT device_key) AS device_count
                FROM fact_device_readings
                WHERE timestamp >= NOW() - INTERVAL '7 days'
                GROUP BY EXTRACT(HOUR FROM timestamp)
                ORDER BY EXTRACT(HOUR FROM timestamp)
            )
            SELECT 
                LPAD(hour::text, 2, '0') || ':00' AS hour,
                data_count AS dataVolume,
                device_count AS devices
            FROM hourly_data
        """)
        
        result = db.execute(query)
        
        # Process the results
        hourly_data = []
        for row in result:
            hourly_data.append({
                "hour": row[0],
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
    Get device failure analysis.
    Returns devices with the most frequent data transmission failures.
    """
    try:
        # Calculate date range based on timeRange parameter
        end_date = datetime.now()
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
        
        # Query to get device failure data
        query = text("""
            WITH date_series AS (
                SELECT generate_series(:start_date::timestamp, :end_date::timestamp, '1 day'::interval) AS date
            ),
            device_status AS (
                SELECT 
                    d.device_key,
                    d.device_id,
                    d.device_name,
                    -- Count days with no data as failures
                    (
                        SELECT COUNT(DISTINCT ds.date)
                        FROM date_series ds
                        LEFT JOIN fact_device_readings r ON 
                            d.device_key = r.device_key AND 
                            DATE(r.timestamp) = DATE(ds.date)
                        WHERE r.reading_key IS NULL
                    ) AS failure_days,
                    -- Calculate uptime percentage
                    (
                        SELECT COUNT(DISTINCT DATE(r.timestamp)) * 100.0 / 
                            (SELECT COUNT(*) FROM date_series)
                        FROM fact_device_readings r
                        WHERE d.device_key = r.device_key 
                        AND timestamp BETWEEN :start_date AND :end_date
                    ) AS uptime_percentage,
                    -- Get first failure date if any
                    (
                        SELECT MIN(DATE(ds.date))
                        FROM date_series ds
                        LEFT JOIN fact_device_readings r ON 
                            d.device_key = r.device_key AND 
                            DATE(r.timestamp) = DATE(ds.date)
                        WHERE r.reading_key IS NULL
                        LIMIT 1
                    ) AS first_failure_date
                FROM dim_device d
                WHERE d.is_active = true AND d.status = 'deployed'
            )
            SELECT
                device_id AS device,
                device_name AS name, 
                failure_days AS failures,
                COALESCE(uptime_percentage, 0) AS uptime,
                CASE
                    WHEN failure_days = 0 THEN 'No failures'
                    WHEN failure_days = 1 THEN 'One failure on ' || first_failure_date
                    ELSE failure_days || ' failures'
                END AS status
            FROM device_status
            ORDER BY failure_days DESC, device_id
            LIMIT 10
        """)
        
        result = db.execute(
            query, 
            {
                "start_date": start_date, 
                "end_date": end_date
            }
        )
        
        # Process the results
        failures_data = []
        for row in result:
            failures_data.append({
                "device": row[0],
                "name": row[1],
                "failures": row[2],
                "uptime": row[3],
                "status": row[4]
            })
        
        return create_json_response(failures_data)
    
    except Exception as e:
        print(f"Error in get_device_failures: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch device failure data: {str(e)}")

# Register the router function
def register_with_app(app):
    """Register the data analytics router with the FastAPI application"""
    app.include_router(router)
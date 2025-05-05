from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import create_engine, text, func
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
from datetime import datetime, timedelta
from decimal import Decimal
import math

# Import your database connection
from app.database import get_db

# Create router
router = APIRouter(prefix="/network-analysis", tags=["network-analysis"])

# Custom JSON encoder for handling special data types
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            try:
                return float(obj)
            except:
                return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Helper function for JSON serialization
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

# Custom response to handle JSON encoding
def create_json_response(content):
    """Create a Response with properly encoded JSON content"""
    json_content = json.dumps(content, cls=CustomJSONEncoder)
    return Response(content=json_content, media_type="application/json")

@router.get("/regional")
def get_regional_analysis(db: Session = Depends(get_db)):
    """Get the latest regional analysis data for all regions"""
    try:
        # Query to get the latest regional analysis for each region
        query = text("""
            WITH latest_per_region AS (
                SELECT region, MAX(created_at) as latest_date
                FROM network_analysis_regional
                GROUP BY region
            )
            SELECT r.id, r.region, r.data, r.created_at
            FROM network_analysis_regional r
            JOIN latest_per_region l 
                ON r.region = l.region AND r.created_at = l.latest_date
            ORDER BY r.region
        """)
        
        result = db.execute(query)
        regions = []
        
        for row in result:
            region_dict = dict(row._mapping)
            region_dict = convert_to_json_serializable(region_dict)
            regions.append(region_dict)
        
        return create_json_response({
            "regions": regions,
            "count": len(regions)
        })
    except Exception as e:
        print(f"Error fetching regional analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch regional analysis: {str(e)}")

@router.get("/regional/{region}")
def get_regional_analysis_by_name(region: str, db: Session = Depends(get_db)):
    """Get the latest regional analysis for a specific region"""
    try:
        query = text("""
            SELECT id, region, data, created_at
            FROM network_analysis_regional
            WHERE region = :region
            ORDER BY created_at DESC
            LIMIT 1
        """)
        
        result = db.execute(query, {"region": region})
        region_data = result.first()
        
        if not region_data:
            raise HTTPException(status_code=404, detail=f"Region '{region}' not found")
        
        region_dict = dict(region_data._mapping)
        region_dict = convert_to_json_serializable(region_dict)
        
        return create_json_response(region_dict)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching regional analysis for {region}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch regional analysis: {str(e)}")

@router.get("/countries")
def get_country_analysis(db: Session = Depends(get_db)):
    """Get the latest country analysis data for all countries"""
    try:
        # Query to get the latest analysis for each country
        query = text("""
            WITH latest_per_country AS (
                SELECT country, MAX(created_at) as latest_date
                FROM network_analysis_country
                GROUP BY country
            )
            SELECT c.id, c.country, c.data, c.created_at
            FROM network_analysis_country c
            JOIN latest_per_country l 
                ON c.country = l.country AND c.created_at = l.latest_date
            ORDER BY c.country
        """)
        
        result = db.execute(query)
        countries = []
        
        for row in result:
            country_dict = dict(row._mapping)
            country_dict = convert_to_json_serializable(country_dict)
            countries.append(country_dict)
        
        return create_json_response({
            "countries": countries,
            "count": len(countries)
        })
    except Exception as e:
        print(f"Error fetching country analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch country analysis: {str(e)}")

@router.get("/countries/{country}")
def get_country_analysis_by_name(country: str, db: Session = Depends(get_db)):
    """Get the latest country analysis for a specific country"""
    try:
        # Get the basic country data first
        query = text("""
            SELECT id, country, data, created_at
            FROM network_analysis_country
            WHERE country = :country
            ORDER BY created_at DESC
            LIMIT 1
        """)
        
        result = db.execute(query, {"country": country})
        country_data = result.first()
        
        if not country_data:
            raise HTTPException(status_code=404, detail=f"Country '{country}' not found")
        
        country_dict = dict(country_data._mapping)
        
        # If there's a devicesList in the data, enhance it with location information
        if country_dict.get('data') and 'devicesList' in country_dict['data']:
            device_keys = [device.get('device_key') for device in country_dict['data']['devicesList'] if device.get('device_key')]
            
            if device_keys:
                # Query to get location information for these devices
                devices_location_query = text("""
                    SELECT d.device_key, d.device_id, l.location_name, 
                           l.village, l.admin_level_city, l.admin_level_country
                    FROM dim_device d
                    LEFT JOIN dim_location l ON d.device_key = l.device_key AND l.is_active = true
                    WHERE d.device_key IN :device_keys
                """)
                
                location_results = db.execute(devices_location_query, {"device_keys": tuple(device_keys)})
                
                # Create a mapping of device_key to location info
                location_map = {}
                for row in location_results:
                    loc_dict = dict(row._mapping)
                    device_key = loc_dict.pop('device_key')
                    location_map[device_key] = loc_dict
                
                # Enhance the devicesList with location information
                for device in country_dict['data']['devicesList']:
                    device_key = device.get('device_key')
                    if device_key and device_key in location_map:
                        device['location'] = location_map[device_key]
        
        country_dict = convert_to_json_serializable(country_dict)
        
        return create_json_response(country_dict)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching country analysis for {country}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch country analysis: {str(e)}")

        
@router.get("/districts")
def get_district_analysis(country: Optional[str] = None, db: Session = Depends(get_db)):
    """Get the latest district analysis data, optionally filtered by country"""
    try:
        # Base query to get the latest analysis for each district
        base_query = """
            WITH latest_per_district AS (
                SELECT district, country, MAX(created_at) as latest_date
                FROM network_analysis_district
                {0}
                GROUP BY district, country
            )
            SELECT d.id, d.district, d.country, d.data, d.created_at
            FROM network_analysis_district d
            JOIN latest_per_district l 
                ON d.district = l.district AND d.country = l.country AND d.created_at = l.latest_date
            ORDER BY d.country, d.district
        """
        
        # Apply country filter if provided
        where_clause = "WHERE country = :country" if country else ""
        query_text = base_query.format(where_clause)
        
        params = {"country": country} if country else {}
        result = db.execute(text(query_text), params)
        
        districts = []
        for row in result:
            district_dict = dict(row._mapping)
            district_dict = convert_to_json_serializable(district_dict)
            districts.append(district_dict)
        
        return create_json_response({
            "districts": districts,
            "count": len(districts),
            "filtered_by_country": country
        })
    except Exception as e:
        print(f"Error fetching district analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch district analysis: {str(e)}")

@router.get("/districts/{district}")
def get_district_analysis_by_name(district: str, country: Optional[str] = None, db: Session = Depends(get_db)):
    """Get the latest district analysis for a specific district, optionally filtered by country"""
    try:
        # Base query
        query_text = """
            SELECT id, district, country, data, created_at
            FROM network_analysis_district
            WHERE district = :district
            {0}
            ORDER BY created_at DESC
            LIMIT 1
        """
        
        # Apply country filter if provided
        where_clause = "AND country = :country" if country else ""
        formatted_query = query_text.format(where_clause)
        
        params = {"district": district, "country": country} if country else {"district": district}
        result = db.execute(text(formatted_query), params)
        
        district_data = result.first()
        
        if not district_data:
            error_msg = f"District '{district}'"
            if country:
                error_msg += f" in country '{country}'"
            error_msg += " not found"
            raise HTTPException(status_code=404, detail=error_msg)
        
        district_dict = dict(district_data._mapping)
        district_dict = convert_to_json_serializable(district_dict)
        
        return create_json_response(district_dict)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching district analysis for {district}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch district analysis: {str(e)}")

@router.get("/summary")
def get_network_summary(db: Session = Depends(get_db)):
    """Get a summary of the network status across all regions"""
    try:
        # Get the latest regional analysis entries
        regional_query = text("""
            WITH latest_per_region AS (
                SELECT region, MAX(created_at) as latest_date
                FROM network_analysis_regional
                GROUP BY region
            )
            SELECT r.region, r.data
            FROM network_analysis_regional r
            JOIN latest_per_region l 
                ON r.region = l.region AND r.created_at = l.latest_date
        """)
        
        result = db.execute(regional_query)
        
        # Initialize summary counters
        total_regions = 0
        total_countries = 0
        total_districts = 0
        total_devices = 0
        online_devices = 0
        offline_devices = 0
        pm25_values = []
        pm10_values = []
        
        # Process each region
        regions_data = []
        for row in result:
            total_regions += 1
            region_data = row.data
            regions_data.append(region_data)
            
            # Add country and district counts
            if 'countries' in region_data:
                total_countries += region_data['countries']
            
            if 'districts' in region_data:
                total_districts += region_data['districts']
            
            # Add device counts
            if 'deviceCount' in region_data:
                total_devices += region_data['deviceCount']
            
            if 'onlineDevices' in region_data:
                online_devices += region_data['onlineDevices']
            
            if 'offlineDevices' in region_data:
                offline_devices += region_data['offlineDevices']
            
            # Collect PM values for averaging
            if 'pm25' in region_data and region_data['pm25'] is not None:
                pm25_values.append(region_data['pm25'])
            
            if 'pm10' in region_data and region_data['pm10'] is not None:
                pm10_values.append(region_data['pm10'])
        
        # Calculate averages for PM values
        avg_pm25 = sum(pm25_values) / len(pm25_values) if pm25_values else None
        avg_pm10 = sum(pm10_values) / len(pm10_values) if pm10_values else None
        
        # Data completeness calculation
        data_completeness = (online_devices / total_devices * 100) if total_devices > 0 else 0
        
        summary = {
            "regions": total_regions,
            "countries": total_countries,
            "districts": total_districts,
            "totalDevices": total_devices,
            "onlineDevices": online_devices,
            "offlineDevices": offline_devices,
            "dataCompleteness": round(data_completeness, 1) if data_completeness else 0,
            "averagePM25": round(avg_pm25, 1) if avg_pm25 is not None else None,
            "averagePM10": round(avg_pm10, 1) if avg_pm10 is not None else None,
            "regionsData": regions_data
        }
        
        return create_json_response(summary)
    except Exception as e:
        print(f"Error generating network summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate network summary: {str(e)}")

def register_with_app(app):
    app.include_router(router)
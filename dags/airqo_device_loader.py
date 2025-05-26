from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.http.sensors.http import HttpSensor
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
import requests
import json
import pandas as pd
import os
from airflow.models import Variable
import pytz

# Define the AirQo API token directly in the DAG for simplicity
# In production, use Airflow Variables or environment variables
AIRQO_JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NmU4NzdjYzQ0NDVkZTAwMTM1NDIyNTIiLCJmaXJzdE5hbWUiOiJLYXNhc2EgTGl2aW5nc3RvbmUgVHJldm9yIiwibGFzdE5hbWUiOiJLYXNhc2EgTGl2aW5nc3RvbmUgVHJldm9yIiwidXNlck5hbWUiOiJrYXNhc2F0cmV2b3IyNUBnbWFpbC5jb20iLCJlbWFpbCI6Imthc2FzYXRyZXZvcjI1QGdtYWlsLmNvbSIsIm9yZ2FuaXphdGlvbiI6ImFpcnFvIiwibG9uZ19vcmdhbml6YXRpb24iOiJhaXJxbyIsInByaXZpbGVnZSI6InVzZXIiLCJjb3VudHJ5IjpudWxsLCJwcm9maWxlUGljdHVyZSI6bnVsbCwicGhvbmVOdW1iZXIiOm51bGwsImNyZWF0ZWRBdCI6IjIwMjQtMDktMTYgMTg6MjQ6MTIiLCJ1cGRhdGVkQXQiOiIyMDI0LTA5LTE2IDE4OjI0OjEyIiwicmF0ZUxpbWl0IjpudWxsLCJsYXN0TG9naW4iOiIyMDI1LTA1LTIwVDEzOjU5OjM2LjgxMloiLCJpYXQiOjE3NDc3NDk1NzZ9.bvuFt9z1Fd9TKIo1ZTTbKt0QcxPRG3Wz47VB8vZXf1Y"
AIRQO_API_BASE_URL = "https://platform.airqo.net/api/v2/devices"

def fetch_airqo_devices(**kwargs):
    """
    Fetch all devices from AirQo API using JWT token
    """
    # Set header with JWT token
    headers = {
        'Authorization': f'JWT {AIRQO_JWT_TOKEN}'
    }
    
    try:
        # Make API request directly to the full URL
        response = requests.get(AIRQO_API_BASE_URL, headers=headers)
        response.raise_for_status()
        
        # Parse JSON response
        data = response.json()
        
        if data.get('success'):
            devices = data.get('devices', [])
            print(f"Successfully fetched {len(devices)} devices from AirQo API")
            
            # Save raw data to JSON file for debugging/reference
            with open('/tmp/airqo_devices_raw.json', 'w') as f:
                json.dump(devices, f)
            
            # Process devices into a dataframe
            if devices:
                device_df = pd.DataFrame(devices)
                # Save processed devices to CSV
                device_df.to_csv('/tmp/airqo_devices.csv', index=False)
                return {
                    'device_count': len(devices),
                    'active_count': len([d for d in devices if d.get('isActive', False)]),
                    'online_count': len([d for d in devices if d.get('isOnline', False)]),
                    'deployed_count': len([d for d in devices if d.get('status') == 'deployed'])
                }
            else:
                print("Warning: No devices returned from API")
                return {'device_count': 0}
        else:
            print(f"API returned failure: {data.get('message', 'Unknown error')}")
            raise Exception(f"API error: {data.get('message', 'Unknown error')}")
    
    except Exception as e:
        print(f"Error fetching devices from AirQo API: {str(e)}")
        raise

def process_and_load_devices(**kwargs):
    """
    Process devices data and load to PostgreSQL with Uganda timezone
    """
    # Set up Uganda timezone
    uganda_tz = pytz.timezone('Africa/Kampala')
    now_uganda = datetime.now(pytz.utc).astimezone(uganda_tz)
    
    try:
        # Check if devices CSV exists
        if not os.path.exists('/tmp/airqo_devices.csv'):
            print("No device data file found, skipping database load")
            return {'status': 'error', 'message': 'No device data file found'}
        
        # Read in the device data
        device_df = pd.read_csv('/tmp/airqo_devices.csv', low_memory=False)
        
        # Handle NaN values
        device_df = device_df.fillna({
            'isActive': False,
            'isOnline': False,
            'status': 'unknown',
            'network': 'unknown',
            'category': 'unknown',
            'height': 0,
            'mobility': False,
            'authRequired': False,
            'visibility': False,
            'isPrimaryInLocation': False
        })
        
        if device_df.empty:
            print("Empty device data, skipping database load")
            return {'status': 'error', 'message': 'Empty device data'}
        
        print(f"Processing {len(device_df)} devices")
        
        # Initialize counters
        inserted = 0
        updated = 0
        errors = 0
        
        # Get PostgreSQL hook
        pg_hook = PostgresHook(postgres_conn_id='postgres_default')
        
        # Process each device
        for _, row in device_df.iterrows():
            try:
                conn = pg_hook.get_conn()
                conn.autocommit = False
                cursor = conn.cursor()
                
                # Set timezone for this session
                cursor.execute("SET timezone = 'Africa/Kampala';")
                
                # Extract device ID - this is our primary key
                device_id = row.get('_id')
                if not device_id:
                    print("Skipping row without device ID")
                    errors += 1
                    continue
                
                # Extract core device fields
                name = row.get('name')
                long_name = row.get('long_name')
                alias = row.get('alias')
                network = row.get('network')
                category = row.get('category')
                serial_number = row.get('serial_number')
                device_number = row.get('device_number')
                status = row.get('status')
                is_active = bool(row.get('isActive', False))
                is_online = bool(row.get('isOnline', False))
                height = float(row.get('height', 0))
                mobility = bool(row.get('mobility', False))
                is_primary = bool(row.get('isPrimaryInLocation', False))
                auth_required = bool(row.get('authRequired', False))
                visibility = bool(row.get('visibility', False))
                mount_type = row.get('mountType')
                power_type = row.get('powerType')
                
                # Handle date fields with timezone conversion
                created_at = None
                if 'createdAt' in row and row['createdAt']:
                    try:
                        created_at_dt = pd.to_datetime(row['createdAt'])
                        if pd.notna(created_at_dt):
                            if created_at_dt.tzinfo is None:
                                created_at = created_at_dt.tz_localize(pytz.utc).astimezone(uganda_tz)
                            else:
                                created_at = created_at_dt.astimezone(uganda_tz)
                    except Exception as e:
                        print(f"Warning: Could not parse createdAt for device {device_id}: {e}")
                
                deployment_date = None
                if 'deployment_date' in row and row['deployment_date']:
                    try:
                        deployment_date_dt = pd.to_datetime(row['deployment_date'])
                        if pd.notna(deployment_date_dt):
                            if deployment_date_dt.tzinfo is None:
                                deployment_date = deployment_date_dt.tz_localize(pytz.utc).astimezone(uganda_tz)
                            else:
                                deployment_date = deployment_date_dt.astimezone(uganda_tz)
                    except Exception as e:
                        print(f"Warning: Could not parse deployment_date for device {device_id}: {e}")
                
                next_maintenance = None
                if 'nextMaintenance' in row and row['nextMaintenance']:
                    try:
                        next_maintenance_dt = pd.to_datetime(row['nextMaintenance'])
                        if pd.notna(next_maintenance_dt):
                            if next_maintenance_dt.tzinfo is None:
                                next_maintenance = next_maintenance_dt.tz_localize(pytz.utc).astimezone(uganda_tz)
                            else:
                                next_maintenance = next_maintenance_dt.astimezone(uganda_tz)
                    except Exception as e:
                        print(f"Warning: Could not parse nextMaintenance for device {device_id}: {e}")
                
                last_active = None
                if 'lastActive' in row and row['lastActive']:
                    try:
                        last_active_dt = pd.to_datetime(row['lastActive'])
                        if pd.notna(last_active_dt):
                            if last_active_dt.tzinfo is None:
                                last_active = last_active_dt.tz_localize(pytz.utc).astimezone(uganda_tz)
                            else:
                                last_active = last_active_dt.astimezone(uganda_tz)
                    except Exception as e:
                        print(f"Warning: Could not parse lastActive for device {device_id}: {e}")
                
                # Extract location data if available
                latitude = row.get('latitude')
                longitude = row.get('longitude')
                
                # Extract site information
                site_id = None
                site_name = None
                location_name = None
                search_name = None
                
                if 'site' in row and isinstance(row['site'], dict):
                    site_id = row['site'].get('_id')
                    site_name = row['site'].get('name')
                    location_name = row['site'].get('location_name')
                    search_name = row['site'].get('search_name')
                
                # Check if device already exists
                cursor.execute("SELECT id FROM devices WHERE device_id = %s", (device_id,))
                result = cursor.fetchone()
                
                if result:
                    # Update existing device
                    # We'll build the update query dynamically to handle NULL values
                    update_fields = []
                    update_values = []
                    
                    # Always update these fields
                    base_fields = [
                        "name = %s",
                        "long_name = %s",
                        "alias = %s",
                        "network = %s",
                        "category = %s",
                        "status = %s",
                        "is_active = %s",
                        "is_online = %s",
                        "height = %s",
                        "mobility = %s",
                        "is_primary_in_location = %s",
                        "auth_required = %s",
                        "visibility = %s",
                        "updated_at = %s"
                    ]
                    
                    update_fields.extend(base_fields)
                    update_values.extend([
                        name,
                        long_name,
                        alias, 
                        network,
                        category,
                        status,
                        is_active,
                        is_online,
                        height,
                        mobility,
                        is_primary,
                        auth_required,
                        visibility,
                        now_uganda
                    ])
                    
                    # Optional fields - only add if they exist
                    if serial_number is not None:
                        update_fields.append("serial_number = %s")
                        update_values.append(serial_number)
                        
                    if device_number is not None:
                        update_fields.append("device_number = %s")
                        update_values.append(device_number)
                        
                    if mount_type is not None:
                        update_fields.append("mount_type = %s")
                        update_values.append(mount_type)
                        
                    if power_type is not None:
                        update_fields.append("power_type = %s")
                        update_values.append(power_type)
                        
                    if created_at is not None:
                        update_fields.append("created_at = %s")
                        update_values.append(created_at)
                        
                    if deployment_date is not None:
                        update_fields.append("deployment_date = %s")
                        update_values.append(deployment_date)
                        
                    if next_maintenance is not None:
                        update_fields.append("next_maintenance = %s")
                        update_values.append(next_maintenance)
                        
                    if last_active is not None:
                        update_fields.append("last_active = %s")
                        update_values.append(last_active)
                        
                    if latitude is not None:
                        update_fields.append("latitude = %s")
                        update_values.append(latitude)
                        
                    if longitude is not None:
                        update_fields.append("longitude = %s")
                        update_values.append(longitude)
                        
                    if site_id is not None:
                        update_fields.append("site_id = %s")
                        update_values.append(site_id)
                        
                    if site_name is not None:
                        update_fields.append("site_name = %s")
                        update_values.append(site_name)
                        
                    if location_name is not None:
                        update_fields.append("location_name = %s")
                        update_values.append(location_name)
                        
                    if search_name is not None:
                        update_fields.append("search_name = %s")
                        update_values.append(search_name)
                    
                    # Add device_id for WHERE clause
                    update_values.append(device_id)
                    
                    # Execute the update
                    update_sql = f"""
                        UPDATE devices 
                        SET {', '.join(update_fields)}
                        WHERE device_id = %s
                    """
                    
                    cursor.execute(update_sql, update_values)
                    updated += 1
                    
                else:
                    # Insert new device
                    insert_fields = [
                        "device_id", "name", "long_name", "alias", "network", 
                        "category", "status", "is_active", "is_online", 
                        "height", "mobility", "is_primary_in_location", 
                        "auth_required", "visibility", "created_at", "updated_at"
                    ]
                    
                    insert_values = [
                        device_id, name, long_name, alias, network,
                        category, status, is_active, is_online,
                        height, mobility, is_primary,
                        auth_required, visibility, now_uganda, now_uganda
                    ]
                    
                    # Optional fields - only include if they exist
                    if serial_number is not None:
                        insert_fields.append("serial_number")
                        insert_values.append(serial_number)
                        
                    if device_number is not None:
                        insert_fields.append("device_number")
                        insert_values.append(device_number)
                        
                    if mount_type is not None:
                        insert_fields.append("mount_type")
                        insert_values.append(mount_type)
                        
                    if power_type is not None:
                        insert_fields.append("power_type")
                        insert_values.append(power_type)
                        
                    if created_at is not None:
                        # Update created_at if we have the actual value
                        insert_fields.remove("created_at")  # Remove the default
                        insert_fields.append("created_at")
                        insert_values.remove(now_uganda)  # Remove the default
                        insert_values.append(created_at)
                        
                    if deployment_date is not None:
                        insert_fields.append("deployment_date")
                        insert_values.append(deployment_date)
                        
                    if next_maintenance is not None:
                        insert_fields.append("next_maintenance")
                        insert_values.append(next_maintenance)
                        
                    if last_active is not None:
                        insert_fields.append("last_active")
                        insert_values.append(last_active)
                        
                    if latitude is not None:
                        insert_fields.append("latitude")
                        insert_values.append(latitude)
                        
                    if longitude is not None:
                        insert_fields.append("longitude")
                        insert_values.append(longitude)
                        
                    if site_id is not None:
                        insert_fields.append("site_id")
                        insert_values.append(site_id)
                        
                    if site_name is not None:
                        insert_fields.append("site_name")
                        insert_values.append(site_name)
                        
                    if location_name is not None:
                        insert_fields.append("location_name")
                        insert_values.append(location_name)
                        
                    if search_name is not None:
                        insert_fields.append("search_name")
                        insert_values.append(search_name)
                    
                    # Create placeholders
                    placeholders = ", ".join(["%s"] * len(insert_values))
                    
                    # Execute the insert
                    insert_sql = f"""
                        INSERT INTO devices 
                        ({', '.join(insert_fields)})
                        VALUES ({placeholders})
                    """
                    
                    cursor.execute(insert_sql, insert_values)
                    inserted += 1
                
                # Commit the transaction
                conn.commit()
                
            except Exception as e:
                # Roll back on error
                if conn:
                    try:
                        conn.rollback()
                    except Exception as rollback_error:
                        print(f"Rollback error for device {device_id}: {str(rollback_error)}")
                
                print(f"Error processing device {device_id}: {str(e)}")
                errors += 1
                
            finally:
                # Close cursor and connection
                if 'cursor' in locals() and cursor:
                    cursor.close()
                if 'conn' in locals() and conn:
                    conn.close()
        
        print(f"Device processing complete. Inserted: {inserted}, Updated: {updated}, Errors: {errors}")
        
        return {
            "processed": len(device_df),
            "inserted": inserted,
            "updated": updated,
            "errors": errors
        }
        
    except Exception as e:
        print(f"Critical error in device processing: {str(e)}")
        raise

# Define check API function for HttpSensor
def check_api_available(response):
    """Check if the API response indicates success"""
    if response.status_code == 200:
        try:
            data = response.json()
            return data.get('success', False)
        except:
            return False
    return False

# Define the DAG
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'airqo_devices_loader',
    default_args=default_args,
    description='Load AirQo devices data into PostgreSQL every 6 hours',
    schedule_interval=timedelta(hours=6),
    start_date=datetime(2025, 5, 20),
    catchup=False,
    tags=['airqo', 'iot', 'devices'],
) as dag:

    # Check if the AirQo API is available - UPDATED VERSION WITH DIRECT URL
    check_api = HttpSensor(
        task_id='check_airqo_api',
        http_conn_id=None,  # Don't use a connection, use a direct URL
        endpoint=AIRQO_API_BASE_URL,  # Use the full URL
        headers={"Authorization": f"JWT {AIRQO_JWT_TOKEN}"},
        request_params={},
        response_check=check_api_available,  # Use our custom response check function
        poke_interval=60,
        timeout=300,
    )
    
    # Create devices table if it doesn't exist
    setup_tables = PostgresOperator(
        task_id='setup_tables',
        postgres_conn_id='postgres_default',
        sql="""
        -- Set timezone to Africa/Kampala for this session
        SET timezone = 'Africa/Kampala';
        
        -- Create the devices table
        CREATE TABLE IF NOT EXISTS devices (
            id SERIAL PRIMARY KEY,
            device_id VARCHAR(100) UNIQUE,
            name VARCHAR(100),
            long_name VARCHAR(100),
            alias VARCHAR(100),
            serial_number VARCHAR(50),
            device_number INTEGER,
            network VARCHAR(50),
            category VARCHAR(50),
            status VARCHAR(50),
            is_active BOOLEAN,
            is_online BOOLEAN,
            height FLOAT,
            mobility BOOLEAN,
            mount_type VARCHAR(50),
            power_type VARCHAR(50),
            is_primary_in_location BOOLEAN,
            auth_required BOOLEAN,
            visibility BOOLEAN,
            latitude FLOAT,
            longitude FLOAT,
            site_id VARCHAR(100),
            site_name VARCHAR(255),
            location_name VARCHAR(255),
            search_name VARCHAR(255),
            deployment_date TIMESTAMP WITH TIME ZONE,
            next_maintenance TIMESTAMP WITH TIME ZONE,
            last_active TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE,
            updated_at TIMESTAMP WITH TIME ZONE
        );
        
        -- Create indexes for common queries
        CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
        CREATE INDEX IF NOT EXISTS idx_devices_is_active ON devices(is_active);
        CREATE INDEX IF NOT EXISTS idx_devices_is_online ON devices(is_online);
        CREATE INDEX IF NOT EXISTS idx_devices_network ON devices(network);
        CREATE INDEX IF NOT EXISTS idx_devices_site_id ON devices(site_id);
        """
    )
    
    # Fetch device data from AirQo API
    fetch_devices = PythonOperator(
        task_id='fetch_devices',
        python_callable=fetch_airqo_devices,
    )
    
    # Process and load devices to PostgreSQL
    load_devices = PythonOperator(
        task_id='load_devices',
        python_callable=process_and_load_devices,
    )
    
    # Clean up temporary files
    cleanup = BashOperator(
        task_id='cleanup',
        bash_command='rm -f /tmp/airqo_devices.csv /tmp/airqo_devices_raw.json',
    )
    
    # Set task dependencies
    check_api >> setup_tables >> fetch_devices >> load_devices >> cleanup
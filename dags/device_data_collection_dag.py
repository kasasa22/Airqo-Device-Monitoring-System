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

# Try to load .env file if available
try:
    from dotenv import load_dotenv
    # In Docker, the .env file is mounted at /opt/airflow/.env
    env_path = '/opt/airflow/.env'
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print(f"Loaded environment from: {env_path}")
except ImportError:
    print("python-dotenv not installed. Using environment variables directly.")
except Exception as e:
    print(f"Error loading .env file: {e}")

# Function to get token safely
def get_airqo_token():
    # First check environment variable (set in docker-compose)
    token = os.environ.get("AIRQO_API_TOKEN")
    if not token:
        # Fallback to Airflow variable
        try:
            token = Variable.get("airqo_api_token", default_var=None)
        except:
            pass
    
    if not token:
        raise ValueError("AirQo API token not found in environment variables or Airflow variables")
    
    return token

def fetch_grids(**kwargs):
    """Fetch all publicly available grids from AirQo API"""
    # Get token using helper function
    airqo_token = get_airqo_token()
    
    # API endpoint for grids
    url = f"https://api.airqo.net/api/v2/devices/metadata/grids?token={airqo_token}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        data = response.json()
        
        if data['success']:
            with open('/tmp/airqo_grids.json', 'w') as f:
                json.dump(data['grids'], f)
            
            # Return grid IDs for next task
            grid_ids = [grid['_id'] for grid in data['grids']]
            return {
                'grid_ids': grid_ids,
                'grid_count': len(grid_ids)
            }
        else:
            raise Exception(f"API returned success=false: {data.get('message', 'Unknown error')}")
    
    except Exception as e:
        print(f"Error fetching grids: {str(e)}")
        raise

def fetch_sites_and_devices(**kwargs):
    """Fetch sites and devices for each grid"""
    ti = kwargs['ti']
    grid_info = ti.xcom_pull(task_ids='fetch_grids')
    
    if not grid_info or not grid_info.get('grid_ids'):
        raise Exception("No grid IDs found from previous task")
    
    grid_ids = grid_info['grid_ids']
    airqo_token = get_airqo_token()
    
    all_sites = []
    all_devices = []
    
    for grid_id in grid_ids:
        # API endpoint for sites and devices in a grid
        url = f"https://api.airqo.net/api/v2/devices/grids/{grid_id}/generate?token={airqo_token}"
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            data = response.json()
            
            if data['success']:
                # Extract sites if available
                if 'sites' in data and isinstance(data['sites'], list):
                    for site in data['sites']:
                        site['grid_id'] = grid_id
                        all_sites.append(site)
                
                # Extract devices if available
                if 'devices' in data and isinstance(data['devices'], list):
                    for device in data['devices']:
                        device['grid_id'] = grid_id
                        all_devices.append(device)
            else:
                print(f"Warning: API returned success=false for grid {grid_id}: {data.get('message', 'Unknown error')}")
        
        except Exception as e:
            print(f"Error fetching sites and devices for grid {grid_id}: {str(e)}")
            # Continue with other grids even if one fails
            continue
    
    # Save to temporary JSON files
    with open('/tmp/airqo_sites.json', 'w') as f:
        json.dump(all_sites, f)
    
    with open('/tmp/airqo_devices_from_grids.json', 'w') as f:
        json.dump(all_devices, f)
    
    return {
        'site_count': len(all_sites),
        'device_count': len(all_devices)
    }

def fetch_device_metadata(**kwargs):
    """Fetch detailed metadata for all available devices"""
    airqo_token = get_airqo_token()
    
    # API endpoint for all devices
    url = f"https://api.airqo.net/api/v2/devices?token={airqo_token}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        data = response.json()
        
        if data['success']:
            devices = data.get('devices', [])
            
            # Save all devices metadata
            with open('/tmp/airqo_all_devices.json', 'w') as f:
                json.dump(devices, f)
            
           
            active_devices = devices
            
            # Save to temporary CSV for next task
            # Save to temporary CSV for next task
            if devices:  # Changed from active_devices to devices
                device_df = pd.DataFrame(devices)  # Changed from active_devices to devices
                device_df.to_csv('/tmp/airqo_active_devices.csv', index=False)

            return {
                'all_device_count': len(devices),
                'active_device_count': len([d for d in devices if d.get('isActive', False) and d.get('status') == 'deployed']),  # We keep this calculation for statistics
                'active_device_ids': [d.get('_id') for d in devices]  # Changed to include all device IDs
            }
        else:
            print(f"Warning: API returned success=false for devices: {data.get('message', 'Unknown error')}")
            return {
                'all_device_count': 0,
                'active_device_count': 0,
                'active_device_ids': []
            }
    
    except Exception as e:
        print(f"Error fetching device metadata: {str(e)}")
        raise

def fetch_device_readings(**kwargs):
    """Fetch measurements for active devices"""
    ti = kwargs['ti']
    device_info = ti.xcom_pull(task_ids='fetch_device_metadata')
    
    if not device_info or not device_info.get('active_device_ids'):
        print("No active device IDs found, skipping measurements fetch")
        return {
            'reading_count': 0
        }
    
    device_ids = device_info['active_device_ids']
    airqo_token = get_airqo_token()
    
    all_readings = []
    
    for device_id in device_ids:
        # API endpoint for recent measurements
        # Note: This might need adjustment based on actual API structure
        url = f"https://api.airqo.net/api/v2/devices/measurements?device={device_id}&recent=true&token={airqo_token}"
        
        try:
            response = requests.get(url)
            if response.status_code == 404:
                # Try alternative endpoint structure if the first one fails
                alt_url = f"https://api.airqo.net/api/v2/devices/{device_id}/measurements?recent=true&token={airqo_token}"
                response = requests.get(alt_url)
                if response.status_code == 404:
                    print(f"No measurements found for device {device_id} on either endpoint structure")
                    continue
            
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('success', False) and 'measurements' in data:
                measurements = data['measurements']
                for measurement in measurements:
                    # Add device_id to each measurement
                    measurement['device_id'] = device_id
                    
                    # Standardize field names (handles different naming conventions)
                    # Battery
                    if 'battery' in measurement and measurement['battery'] is not None:
                        measurement['battery_voltage'] = measurement['battery']
                    elif 'battery_voltage' in measurement and measurement['battery_voltage'] is not None:
                        measurement['battery_voltage'] = measurement['battery_voltage']
                    else:
                        measurement['battery_voltage'] = None
                        
                    # Signal strength
                    if 'signal' in measurement and measurement['signal'] is not None:
                        measurement['signal_strength_dbm'] = measurement['signal']
                    elif 'signal_strength' in measurement and measurement['signal_strength'] is not None:
                        measurement['signal_strength_dbm'] = measurement['signal_strength']
                    else:
                        measurement['signal_strength_dbm'] = None
                    
                    all_readings.append(measurement)
            else:
                print(f"Warning: Failed to get measurements for device {device_id}: {data.get('message', 'Unknown error')}")
        
        except Exception as e:
            print(f"Error fetching measurements for device {device_id}: {str(e)}")
            continue
    
    # Save to temporary file
    if all_readings:
        readings_df = pd.DataFrame(all_readings)
        readings_df.to_csv('/tmp/airqo_readings.csv', index=False)
    
    return {
        'reading_count': len(all_readings)
    }

def load_device_metadata_to_postgres(**kwargs):
    """
    Load device metadata to PostgreSQL with improved timestamp handling
    and transaction management.
    """
    successful_devices = 0
    failed_devices = 0
    
    try:
        # Check if active devices CSV exists
        import os
        if not os.path.exists('/tmp/airqo_active_devices.csv'):
            print("No active device data file found, skipping database load")
            return
        
        device_df = pd.read_csv('/tmp/airqo_active_devices.csv', low_memory=False)
        
        # Handle any NaN values
        device_df = device_df.fillna({
            'isActive': False,
            'isOnline': False,
            'status': 'unknown'
        })
        
        if device_df.empty:
            print("No active device data found, skipping database load")
            return
        
        print(f"Processing {len(device_df)} devices")
        pg_hook = PostgresHook(postgres_conn_id='postgres_default')
        
        # Process each device with individual transactions
        for _, row in device_df.iterrows():
            conn = None
            cursor = None
            device_id = row.get('_id', 'unknown')
            
            try:
                # Create a new connection for each device to isolate transactions
                conn = pg_hook.get_conn()
                # Disable autocommit to ensure transaction control
                conn.autocommit = False
                cursor = conn.cursor()
                
                # Extract core metadata
                if not device_id:  # Skip if no device ID
                    print(f"Skipping row with missing device ID")
                    continue
                    
                device_name = row.get('name', 'Unknown')
                is_active = bool(row.get('isActive', False))
                status = row.get('status', 'Unknown')
                is_online = bool(row.get('isOnline', False))
                
                # Handle optional fields with proper null handling
                network = row.get('network')
                category = row.get('category')
                mount_type = row.get('mountType')
                power_type = row.get('powerType')
                height = row.get('height')
                
                # Handle timestamp fields with special care
                next_maintenance = None
                if 'nextMaintenance' in row and row['nextMaintenance']:
                    try:
                        # Convert to datetime and handle NaT values
                        next_maintenance_dt = pd.to_datetime(row['nextMaintenance'])
                        if pd.notna(next_maintenance_dt):
                            next_maintenance = next_maintenance_dt.to_pydatetime()
                    except Exception as e:
                        print(f"Warning: Could not parse nextMaintenance for device {device_id}: {e}")
                
                deployment_date = None
                if 'deployment_date' in row and row['deployment_date']:
                    try:
                        # Convert to datetime and handle NaT values
                        deployment_date_dt = pd.to_datetime(row['deployment_date'])
                        if pd.notna(deployment_date_dt):
                            deployment_date = deployment_date_dt.to_pydatetime()
                    except Exception as e:
                        print(f"Warning: Could not parse deployment_date for device {device_id}: {e}")
                
                # Check if device exists
                cursor.execute("SELECT device_key FROM dim_device WHERE device_id = %s", (device_id,))
                result = cursor.fetchone()
                
                if result:
                    # Update existing device
                    device_key = result[0]
                    # Build update query dynamically to handle NULL values properly
                    update_fields = []
                    update_values = []
                    
                    # Always update these fields
                    update_fields.extend([
                        "device_name = %s",
                        "is_active = %s",
                        "status = %s",
                        "is_online = %s",
                        "last_updated = %s"
                    ])
                    update_values.extend([
                        device_name,
                        is_active,
                        status,
                        is_online,
                        datetime.now()
                    ])
                    
                    # Optional fields - only add if they exist
                    if network is not None:
                        update_fields.append("network = %s")
                        update_values.append(network)
                    
                    if category is not None:
                        update_fields.append("category = %s")
                        update_values.append(category)
                    
                    if mount_type is not None:
                        update_fields.append("mount_type = %s")
                        update_values.append(mount_type)
                    
                    if power_type is not None:
                        update_fields.append("power_type = %s")
                        update_values.append(power_type)
                    
                    if height is not None:
                        update_fields.append("height = %s")
                        update_values.append(height)
                    
                    if next_maintenance is not None:
                        update_fields.append("next_maintenance = %s")
                        update_values.append(next_maintenance)
                    
                    # Add device_id for WHERE clause
                    update_values.append(device_id)
                    
                    update_sql = f"""
                        UPDATE dim_device 
                        SET {', '.join(update_fields)}
                        WHERE device_id = %s
                    """
                    
                    cursor.execute(update_sql, update_values)
                    
                else:
                    # Insert new device
                    insert_fields = ["device_id", "device_name", "is_active", "status", "is_online", "first_seen", "last_updated"]
                    insert_values = [device_id, device_name, is_active, status, is_online, datetime.now(), datetime.now()]
                    
                    # Optional fields - only add if they exist
                    if network is not None:
                        insert_fields.append("network")
                        insert_values.append(network)
                    
                    if category is not None:
                        insert_fields.append("category")
                        insert_values.append(category)
                    
                    if mount_type is not None:
                        insert_fields.append("mount_type")
                        insert_values.append(mount_type)
                    
                    if power_type is not None:
                        insert_fields.append("power_type")
                        insert_values.append(power_type)
                    
                    if height is not None:
                        insert_fields.append("height")
                        insert_values.append(height)
                    
                    if next_maintenance is not None:
                        insert_fields.append("next_maintenance")
                        insert_values.append(next_maintenance)
                    
                    placeholders = ", ".join(["%s"] * len(insert_values))
                    
                    insert_sql = f"""
                        INSERT INTO dim_device 
                        ({', '.join(insert_fields)})
                        VALUES ({placeholders})
                        RETURNING device_key
                    """
                    
                    cursor.execute(insert_sql, insert_values)
                    device_key = cursor.fetchone()[0]
                
                # Update location if available
                lat = row.get('latitude')
                lon = row.get('longitude')
                if lat is not None and lon is not None:
                    # Extract site information if available
                    site_id = None
                    site_name = None
                    
                    if 'site' in row and isinstance(row['site'], dict):
                        site_id = row['site'].get('_id')
                        site_name = row['site'].get('name')
                    
                    # Handle deployment_date for location separately to ensure it's a valid timestamp
                    location_date = datetime.now()  # Default to current time
                    
                    # Explicitly build the insert statement to handle nullable timestamps properly
                    cursor.execute(
                        """
                        INSERT INTO dim_location
                        (device_key, latitude, longitude, site_id, site_name, recorded_at)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (device_key) DO UPDATE
                        SET latitude = EXCLUDED.latitude,
                            longitude = EXCLUDED.longitude,
                            site_id = EXCLUDED.site_id,
                            site_name = EXCLUDED.site_name,
                            recorded_at = EXCLUDED.recorded_at
                        """,
                        (
                            device_key,
                            float(lat),
                            float(lon),
                            site_id,
                            site_name,
                            location_date
                        )
                    )
                    
                    # If deployment_date is valid, update it separately to avoid NaT issues
                    if deployment_date is not None:
                        cursor.execute(
                            """
                            UPDATE dim_location
                            SET deployment_date = %s
                            WHERE device_key = %s
                            """,
                            (deployment_date, device_key)
                        )
                
                # Record current device status
                cursor.execute(
                    """
                    INSERT INTO fact_device_status 
                    (device_key, timestamp, is_online, device_status)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        device_key,
                        datetime.now(),
                        is_online,
                        status
                    )
                )
                
                # Commit the transaction for this device
                conn.commit()
                successful_devices += 1
                print(f"Successfully processed device {device_id}")
                
            except Exception as e:
                # Roll back transaction on error
                if conn:
                    try:
                        conn.rollback()
                    except Exception as rollback_error:
                        print(f"Rollback error for device {device_id}: {str(rollback_error)}")
                
                print(f"Error processing device {device_id}: {str(e)}")
                failed_devices += 1
                
            finally:
                # Always close cursor and connection
                if cursor:
                    cursor.close()
                if conn:
                    conn.close()
        
        print(f"Device processing complete. Success: {successful_devices}, Failed: {failed_devices}")
        
        # Return statistics for potential use in XCom
        return {
            "processed_devices": len(device_df),
            "successful_devices": successful_devices,
            "failed_devices": failed_devices
        }
        
    except Exception as e:
        print(f"Critical error in device metadata loading: {str(e)}")
        # Re-raise to mark task as failed
        raise
def load_readings_to_postgres(**kwargs):
    """Load device readings to PostgreSQL"""
    try:
        # Check if readings CSV exists
        import os
        if not os.path.exists('/tmp/airqo_readings.csv'):
            print("No readings data file found, skipping database load")
            return
        
        readings_df = pd.read_csv('/tmp/airqo_readings.csv')
        
        if readings_df.empty:
            print("No readings data found, skipping database load")
            return
        
        pg_hook = PostgresHook(postgres_conn_id='postgres_default')
        conn = pg_hook.get_conn()
        cursor = conn.cursor()
        
        # Process each reading
        for _, row in readings_df.iterrows():
            try:
                reading_data = row.to_dict()
                
                device_id = reading_data.get('device_id')
                
                # Get device_key from dim_device
                cursor.execute("SELECT device_key FROM dim_device WHERE device_id = %s", (device_id,))
                result = cursor.fetchone()
                
                if result:
                    device_key = result[0]
                    
                    # Safely extract values with fallbacks
                    timestamp = reading_data.get('timestamp')
                    if timestamp:
                        try:
                            timestamp = pd.to_datetime(timestamp)
                        except:
                            timestamp = datetime.now()  # Fallback if parsing fails
                    else:
                        timestamp = datetime.now()
                    
                    # Extract sensor readings
                    pm2_5 = reading_data.get('pm2_5')
                    pm10 = reading_data.get('pm10')
                    battery = reading_data.get('battery_voltage')
                    signal = reading_data.get('signal_strength_dbm')
                    temperature = reading_data.get('temperature')
                    humidity = reading_data.get('humidity')
                    
                    # Insert the reading
                    cursor.execute(
                        """
                        INSERT INTO fact_device_readings
                        (device_key, timestamp, battery_voltage, signal_strength_dbm, 
                        temperature_celsius, humidity_percent, pm2_5, pm10)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            device_key,
                            timestamp,
                            float(battery) if battery is not None else None,
                            int(signal) if signal is not None else None,
                            float(temperature) if temperature is not None else None,
                            float(humidity) if humidity is not None else None,
                            float(pm2_5) if pm2_5 is not None else None,
                            float(pm10) if pm10 is not None else None
                        )
                    )
                else:
                    print(f"Device not found in database: {device_id}")
            
            except Exception as e:
                print(f"Error processing reading for device {reading_data.get('device_id')}: {str(e)}")
                # Continue with next reading
        
        conn.commit()
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error loading readings: {str(e)}")
        raise

# Function to check environment variables and return token for testing
def print_env_vars(**kwargs):
    """Print environment variables for debugging"""
    token = get_airqo_token()
    print(f"Successfully retrieved token (first 4 chars): {token[:4]}..." if token else "No token found")
    return token

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'airqo_device_data_collection',
    default_args=default_args,
    description='Collect device data and measurements from AirQo API',
    schedule_interval=timedelta(hours=1),
    start_date=datetime(2025, 3, 1),
    catchup=False,
    tags=['airqo', 'iot', 'telemetry', 'air-quality'],
) as dag:

    # Test environment variables
    test_env_vars = PythonOperator(
        task_id='test_env_vars',
        python_callable=print_env_vars,
    )
    
    # API availability check
    check_api = HttpSensor(
        task_id='check_airqo_api',
        http_conn_id='airqo_conn',
        endpoint='api/v2/devices',
        request_params={'token': '{{ ti.xcom_pull(task_ids="test_env_vars") }}'},
        response_check=lambda response: response.status_code == 200,
        poke_interval=60,
        timeout=300,
    )
    
    # Database setup task
    setup_tables = PostgresOperator(
        task_id='setup_tables',
        postgres_conn_id='postgres_default',
        sql="""
        -- Dimension tables
        CREATE TABLE IF NOT EXISTS dim_device (
            device_key SERIAL PRIMARY KEY,
            device_id VARCHAR(100) UNIQUE,
            device_name VARCHAR(100),
            network VARCHAR(50),
            category VARCHAR(50),
            is_active BOOLEAN,
            status VARCHAR(50),
            mount_type VARCHAR(50),
            power_type VARCHAR(50),
            height FLOAT,
            next_maintenance TIMESTAMP,
            first_seen TIMESTAMP,
            last_updated TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS dim_location (
            location_key SERIAL PRIMARY KEY,
            device_key INTEGER REFERENCES dim_device(device_key),
            latitude FLOAT,
            longitude FLOAT,
            site_id VARCHAR(100),
            site_name VARCHAR(255),
            deployment_date TIMESTAMP,
            recorded_at TIMESTAMP,
            UNIQUE(device_key)
        );
        
        CREATE TABLE IF NOT EXISTS dim_grid (
            grid_key SERIAL PRIMARY KEY,
            grid_id VARCHAR(100) UNIQUE,
            grid_name VARCHAR(100),
            admin_level VARCHAR(50),
            first_seen TIMESTAMP,
            last_updated TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS dim_site (
            site_key SERIAL PRIMARY KEY,
            site_id VARCHAR(100) UNIQUE,
            site_name VARCHAR(255),
            search_name VARCHAR(100),
            grid_key INTEGER REFERENCES dim_grid(grid_key) NULL,
            latitude FLOAT,
            longitude FLOAT,
            country VARCHAR(100),
            city VARCHAR(100),
            first_seen TIMESTAMP,
            last_updated TIMESTAMP
        );
        
        -- Fact tables
        CREATE TABLE IF NOT EXISTS fact_device_status (
            status_key SERIAL PRIMARY KEY,
            device_key INTEGER REFERENCES dim_device(device_key),
            timestamp TIMESTAMP,
            is_online BOOLEAN,
            device_status VARCHAR(50)
        );
        
        CREATE TABLE IF NOT EXISTS fact_device_readings (
            reading_key SERIAL PRIMARY KEY,
            device_key INTEGER REFERENCES dim_device(device_key),
            timestamp TIMESTAMP,
            battery_voltage FLOAT,
            signal_strength_dbm INTEGER,
            temperature_celsius FLOAT,
            humidity_percent FLOAT,
            pm2_5 FLOAT,
            pm10 FLOAT
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_device_status_timestamp ON fact_device_status(timestamp);
        CREATE INDEX IF NOT EXISTS idx_device_readings_timestamp ON fact_device_readings(timestamp);
        CREATE INDEX IF NOT EXISTS idx_device_status_device_key ON fact_device_status(device_key);
        CREATE INDEX IF NOT EXISTS idx_device_readings_device_key ON fact_device_readings(device_key);
        """
    )
    
    # Fetch grids from AirQo API
    fetch_grids_task = PythonOperator(
        task_id='fetch_grids',
        python_callable=fetch_grids,
    )
    
    # Fetch sites and devices for each grid
    fetch_sites_devices_task = PythonOperator(
        task_id='fetch_sites_and_devices',
        python_callable=fetch_sites_and_devices,
    )
    
    # Fetch device metadata
    fetch_device_metadata_task = PythonOperator(
        task_id='fetch_device_metadata',
        python_callable=fetch_device_metadata,
    )
    
    # Fetch device readings
    fetch_readings_task = PythonOperator(
        task_id='fetch_device_readings',
        python_callable=fetch_device_readings,
    )
    
    # Load device metadata to PostgreSQL
    load_metadata_task = PythonOperator(
        task_id='load_device_metadata',
        python_callable=load_device_metadata_to_postgres,
    )
    
    # Load readings to PostgreSQL
    load_readings_task = PythonOperator(
        task_id='load_readings',
        python_callable=load_readings_to_postgres,
    )
    
    # Cleanup temporary files
    cleanup_task = BashOperator(
        task_id='cleanup_temp_files',
        bash_command='rm -f /tmp/airqo_*.csv /tmp/airqo_*.json',
    )
    
    # Define task dependencies
    test_env_vars >> check_api >> setup_tables
    
    # Grid and site data path
    setup_tables >> fetch_grids_task >> fetch_sites_devices_task
    
    # Device metadata and readings path
    setup_tables >> fetch_device_metadata_task >> load_metadata_task
    fetch_device_metadata_task >> fetch_readings_task >> load_readings_task
    
    # Join paths and cleanup
    [fetch_sites_devices_task, load_readings_task] >> cleanup_task
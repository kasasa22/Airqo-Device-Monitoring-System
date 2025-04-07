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
    token = os.environ.get("AIRQO_API_TOKEN")
    if not token:
        try:
            token = Variable.get("airqo_api_token", default_var=None)
        except:
            pass
    
    if not token:
        raise ValueError("AirQo API token not found in environment variables or Airflow variables")
    
    return token

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
            
            # Include all devices without filtering
            active_devices = devices
            
            # Save to temporary CSV for next task
            if devices:
                device_df = pd.DataFrame(devices)
                device_df.to_csv('/tmp/airqo_active_devices.csv', index=False)

            return {
                'all_device_count': len(devices),
                'active_device_count': len([d for d in devices if d.get('isActive', False) and d.get('status') == 'deployed']),
                'active_device_ids': [d.get('_id') for d in devices]
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
    'airqo_device_metadata_loader',
    default_args=default_args,
    description='Load all device metadata from AirQo API into PostgreSQL',
    schedule_interval=timedelta(hours=6),
    start_date=datetime(2025, 3, 1),
    catchup=False,
    tags=['airqo', 'iot', 'device-metadata'],
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
        
        -- Fact tables
        CREATE TABLE IF NOT EXISTS fact_device_status (
            status_key SERIAL PRIMARY KEY,
            device_key INTEGER REFERENCES dim_device(device_key),
            timestamp TIMESTAMP,
            is_online BOOLEAN,
            device_status VARCHAR(50)
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_device_status_timestamp ON fact_device_status(timestamp);
        CREATE INDEX IF NOT EXISTS idx_device_status_device_key ON fact_device_status(device_key);
        """
    )
    
    # Fetch device metadata
    fetch_device_metadata_task = PythonOperator(
        task_id='fetch_device_metadata',
        python_callable=fetch_device_metadata,
    )
    
    # Load device metadata to PostgreSQL
    load_metadata_task = PythonOperator(
        task_id='load_device_metadata',
        python_callable=load_device_metadata_to_postgres,
    )
    
    # Cleanup temporary files
    cleanup_task = BashOperator(
        task_id='cleanup_temp_files',
        bash_command='rm -f /tmp/airqo_*.csv /tmp/airqo_*.json',
    )
    
    # Define task dependencies - simplified linear flow
    test_env_vars >> check_api >> setup_tables >> fetch_device_metadata_task >> load_metadata_task >> cleanup_task
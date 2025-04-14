from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.postgres.operators.postgres import PostgresOperator
import requests
import json
import os
from airflow.models import Variable
import time
import pandas as pd

# Default arguments for the DAG
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=2),
}

# Function to get the AirQo API token
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

# Function to get all site IDs from the database
def get_site_ids(**kwargs):
    pg_hook = PostgresHook(postgres_conn_id='postgres_default')
    
    # Query to get site IDs
    site_query = """
    SELECT site_id FROM dim_site 
    WHERE site_id IS NOT NULL
    """
    
    connection = pg_hook.get_conn()
    cursor = connection.cursor()
    cursor.execute(site_query)
    site_ids = [row[0] for row in cursor.fetchall()]
    cursor.close()
    connection.close()
    
    print(f"Found {len(site_ids)} sites")
    
    # Store site IDs for later tasks
    return site_ids

# Function to fetch recent measurements for a specific site
def fetch_site_measurements(site_id, **kwargs):
    token = get_airqo_token()
    api_url = f"https://api.airqo.net/api/v2/devices/measurements/sites/{site_id}/recent?token={token}"
    
    print(f"Starting API request for site {site_id} at {datetime.now().isoformat()}")
    start_time = time.time()
    
    for attempt in range(3):
        try:
            print(f"Attempt {attempt+1}/3 for site {site_id}")
            
            # Use a session to better control the connection
            session = requests.Session()
            
            # Set a longer timeout (90 seconds)
            response = session.get(
                api_url, 
                timeout=90,
                headers={
                    'User-Agent': 'AirQo-Data-Pipeline/1.0',
                    'Accept': 'application/json'
                }
            )
            
            elapsed = time.time() - start_time
            print(f"Request completed in {elapsed:.2f} seconds with status code {response.status_code}")
            
            response.raise_for_status()
            data = response.json()
            
            if not data.get('success', False):
                print(f"API returned success=false for site {site_id}: {data.get('message', 'Unknown error')}")
                return None
            
            # Log basic stats about the response
            measurements = data.get('measurements', [])
            print(f"Received {len(measurements)} measurements for site {site_id}")
            
            return {
                'site_id': site_id,
                'data': data
            }
            
        except requests.exceptions.Timeout:
            elapsed = time.time() - start_time
            print(f"Timeout error (attempt {attempt+1}/3) after {elapsed:.2f} seconds")
            # Don't sleep after the last attempt
            if attempt < 2:
                print(f"Waiting 5 seconds before retry...")
                time.sleep(5)
                
        except Exception as e:
            print(f"Error fetching measurements for site {site_id}: {type(e).__name__}: {str(e)}")
            # Don't retry on non-timeout errors
            return None
    
    print(f"Failed to fetch measurements for site {site_id} after 3 attempts")
    return None

# Function to process all sites
def process_all_sites(**kwargs):
    ti = kwargs['ti']
    site_ids = ti.xcom_pull(task_ids='get_site_ids')
    
    if not site_ids:
        print("No site IDs found. Skipping measurements collection.")
        return []
    
    print(f"Processing {len(site_ids)} sites one by one")
    measurements_by_site = []
    
    for i, site_id in enumerate(site_ids):
        print(f"Processing site {i+1}/{len(site_ids)}: {site_id}")
        measurements = fetch_site_measurements(site_id)
        
        if measurements and measurements.get('data'):
            measurements_by_site.append(measurements)
            print(f"Successfully processed site {site_id}")
        else:
            print(f"Failed to process site {site_id}")
        
        # Add a delay between sites to avoid overwhelming the API
        # and to allow network connections to fully close
        if i < len(site_ids) - 1:
            print(f"Waiting 3 seconds before processing next site...")
            time.sleep(3)
    
    print(f"Successfully fetched measurements for {len(measurements_by_site)} out of {len(site_ids)} sites")
    return measurements_by_site

# Function to store site measurements in the database
def store_site_measurements(**kwargs):
    ti = kwargs['ti']
    all_measurements = ti.xcom_pull(task_ids='process_all_sites')
    
    if not all_measurements:
        print("No measurements to store. Skipping.")
        return
    
    pg_hook = PostgresHook(postgres_conn_id='postgres_default')
    connection = pg_hook.get_conn()
    
    inserted_count = 0
    skipped_count = 0
    
    try:
        for site_data in all_measurements:
            site_id = site_data['site_id']
            response_data = site_data['data']
            measurements = response_data.get('measurements', [])
            
            # Get site_key for the site_id
            cursor = connection.cursor()
            cursor.execute("SELECT site_key FROM dim_site WHERE site_id = %s", (site_id,))
            result = cursor.fetchone()
            
            if not result:
                print(f"Site {site_id} not found in dim_site table. Skipping.")
                skipped_count += len(measurements)
                cursor.close()
                continue
            
            site_key = result[0]
            
            # Process each measurement
            for measurement in measurements:
                try:
                    # Extract timestamp
                    timestamp_str = measurement.get('time')
                    if not timestamp_str:
                        continue
                    
                    # Parse timestamp
                    try:
                        timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    except:
                        try:
                            timestamp = datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                        except:
                            timestamp = datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M:%SZ")
                    
                    # Extract measurements data
                    pm2_5 = measurement.get('pm2_5', {}).get('value')
                    pm10 = measurement.get('pm10', {}).get('value')
                    no2 = measurement.get('no2', {}).get('value')
                    
                    # Extract device data
                    device_id = measurement.get('device_id')
                    device_name = measurement.get('device')
                    frequency = measurement.get('frequency')
                    is_reading_primary = measurement.get('is_reading_primary', False)
                    
                    # AQI information
                    aqi_category = measurement.get('aqi_category')
                    aqi_color = measurement.get('aqi_color')
                    aqi_color_name = measurement.get('aqi_color_name')
                    
                    # Time difference in hours
                    time_difference_hours = measurement.get('timeDifferenceHours')
                    
                    # Get device_key if device exists
                    device_key = None
                    if device_id:
                        cursor.execute("SELECT device_key FROM dim_device WHERE device_id = %s", (device_id,))
                        device_result = cursor.fetchone()
                        if device_result:
                            device_key = device_result[0]
                    
                    # Check if this measurement already exists
                    cursor.execute(
                        """
                        SELECT 1 FROM fact_site_readings 
                        WHERE site_key = %s AND timestamp = %s
                        LIMIT 1
                        """, 
                        (site_key, timestamp)
                    )
                    
                    if cursor.fetchone():
                        # Measurement already exists, skip
                        skipped_count += 1
                        continue
                    
                    # Insert the measurement
                    cursor.execute(
                        """
                        INSERT INTO fact_site_readings 
                        (site_key, device_key, timestamp, pm2_5, pm10, no2, device_id, device_name, 
                        frequency, is_reading_primary, aqi_category, aqi_color, aqi_color_name, time_difference_hours)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING reading_key
                        """,
                        (
                            site_key, device_key, timestamp, pm2_5, pm10, no2, device_id, device_name,
                            frequency, is_reading_primary, aqi_category, aqi_color, aqi_color_name, time_difference_hours
                        )
                    )
                    
                    reading_key = cursor.fetchone()[0]
                    
                    # Store health tips if available
                    health_tips = measurement.get('health_tips', [])
                    for tip in health_tips:
                        tip_id = tip.get('_id')
                        title = tip.get('title')
                        description = tip.get('description')
                        image = tip.get('image')
                        tag_line = tip.get('tag_line')
                        
                        cursor.execute(
                            """
                            INSERT INTO fact_health_tips
                            (reading_key, tip_id, title, description, image_url, tag_line)
                            VALUES (%s, %s, %s, %s, %s, %s)
                            """,
                            (reading_key, tip_id, title, description, image, tag_line)
                        )
                    
                    # Store AQI ranges if available
                    aqi_ranges = measurement.get('aqi_ranges', {})
                    for range_type, range_values in aqi_ranges.items():
                        min_value = range_values.get('min')
                        max_value = range_values.get('max')
                        
                        cursor.execute(
                            """
                            INSERT INTO fact_aqi_ranges
                            (reading_key, range_type, min_value, max_value)
                            VALUES (%s, %s, %s, %s)
                            """,
                            (reading_key, range_type, min_value, max_value)
                        )
                    
                    inserted_count += 1
                    
                except Exception as e:
                    print(f"Error processing measurement for site {site_id}: {str(e)}")
                    continue
            
            cursor.close()
        
        # Commit all changes
        connection.commit()
        print(f"Measurements processing complete. Inserted: {inserted_count}, Skipped: {skipped_count}")
        
    except Exception as e:
        connection.rollback()
        print(f"Error in store_site_measurements: {str(e)}")
        raise
    finally:
        connection.close()

# Create the DAG
with DAG(
    'airqo_site_measurements_collector',
    default_args=default_args,
    description='Collect recent measurements from AirQo API for all sites',
    schedule_interval=timedelta(hours=1),  # Run every hour
    start_date=datetime(2025, 4, 1),
    catchup=False,
    tags=['airqo', 'measurements', 'sites', 'api'],
) as dag:
    
    # Create necessary tables
    setup_tables = PostgresOperator(
        task_id='setup_tables',
        postgres_conn_id='postgres_default',
        sql="""
        -- Create fact_site_readings if not exists
        CREATE TABLE IF NOT EXISTS fact_site_readings (
            reading_key SERIAL PRIMARY KEY,
            site_key INTEGER REFERENCES dim_site(site_key),
            device_key INTEGER REFERENCES dim_device(device_key),
            timestamp TIMESTAMP NOT NULL,
            device_id VARCHAR(100),
            device_name VARCHAR(100),
            pm2_5 DECIMAL(10, 5),
            pm10 DECIMAL(10, 5),
            no2 DECIMAL(10, 5),
            frequency VARCHAR(20),
            is_reading_primary BOOLEAN DEFAULT FALSE,
            aqi_category VARCHAR(50),
            aqi_color VARCHAR(20),
            aqi_color_name VARCHAR(50),
            time_difference_hours DECIMAL(10, 5),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(site_key, timestamp)
        );
        
        -- Update fact_health_tips to include tag_line if it doesn't exist
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'fact_health_tips' 
                AND column_name = 'tag_line'
            ) THEN
                ALTER TABLE fact_health_tips ADD COLUMN tag_line TEXT;
            END IF;
        END $$;
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_fact_site_readings_site_timestamp 
        ON fact_site_readings(site_key, timestamp);
        
        CREATE INDEX IF NOT EXISTS idx_fact_site_readings_timestamp 
        ON fact_site_readings(timestamp);
        
        CREATE INDEX IF NOT EXISTS idx_fact_site_readings_device 
        ON fact_site_readings(device_key);
        """
    )
    
    # Task to get site IDs
    get_site_ids_task = PythonOperator(
        task_id='get_site_ids',
        python_callable=get_site_ids,
    )
    
    # Task to process all sites
    process_sites_task = PythonOperator(
        task_id='process_all_sites',
        python_callable=process_all_sites,
    )
    
    # Task to store measurements
    store_measurements_task = PythonOperator(
        task_id='store_site_measurements',
        python_callable=store_site_measurements,
    )
    
    # Set up task dependencies
    setup_tables >> get_site_ids_task >> process_sites_task >> store_measurements_task
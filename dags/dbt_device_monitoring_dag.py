# dags/device_data_collection_dag.py
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

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

def fetch_device_data(**kwargs):
    """Fetch data from ThingSpeak API for all devices"""
    # This would be populated from a devices table
    device_ids = ['12345', '12346', '12347']  # Example device IDs
    api_key = "YOUR_THINGSPEAK_API_KEY"  # Store this in Airflow variables or secrets
    
    all_device_data = []
    
    for device_id in device_ids:
        # ThingSpeak API endpoint
        url = f"https://api.thingspeak.com/channels/{device_id}/feeds.json?api_key={api_key}&results=1000"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            for entry in data['feeds']:
                all_device_data.append({
                    'device_id': device_id,
                    'timestamp': entry['created_at'],
                    'battery_voltage': entry.get('field1'),
                    'signal_strength_dbm': entry.get('field2'),
                    'temperature_celsius': entry.get('field3'),
                    'humidity_percent': entry.get('field4'),
                })
    
    # Convert to DataFrame for easier processing
    df = pd.DataFrame(all_device_data)
    
    # Save to temporary CSV
    df.to_csv('/tmp/device_data.csv', index=False)
    return '/tmp/device_data.csv'

def load_to_postgres(**kwargs):
    """Load device data to PostgreSQL"""
    ti = kwargs['ti']
    file_path = ti.xcom_pull(task_ids='fetch_device_data')
    
    pg_hook = PostgresHook(postgres_conn_id='postgres_default')
    conn = pg_hook.get_conn()
    cursor = conn.cursor()
    
    # Read CSV
    df = pd.read_csv(file_path)
    
    # Insert each row to fact_device_status
    for _, row in df.iterrows():
        device_key_query = "SELECT device_key FROM dim_device WHERE device_id = %s"
        cursor.execute(device_key_query, (row['device_id'],))
        device_key = cursor.fetchone()
        
        if device_key:
            device_key = device_key[0]
            # Insert into fact_device_status
            cursor.execute(
                """
                INSERT INTO fact_device_status 
                (device_key, timestamp, battery_voltage, signal_strength_dbm, 
                temperature_celsius, humidity_percent)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    device_key, 
                    row['timestamp'],
                    row['battery_voltage'],
                    row['signal_strength_dbm'],
                    row['temperature_celsius'],
                    row['humidity_percent']
                )
            )
    
    conn.commit()
    cursor.close()
    conn.close()

with DAG(
    'device_data_collection',
    default_args=default_args,
    description='Collect telemetry data from IoT devices',
    schedule_interval=timedelta(hours=1),
    start_date=datetime(2025, 3, 1),
    catchup=False,
    tags=['airqo', 'iot', 'telemetry'],
) as dag:

    check_api = HttpSensor(
        task_id='check_thingspeak_api',
        http_conn_id='thingspeak_conn',
        endpoint='status',
        request_params={},
        response_check=lambda response: response.status_code == 200,
        poke_interval=60,
        timeout=300,
    )
    
    create_temp_table = PostgresOperator(
        task_id='create_temp_table',
        postgres_conn_id='postgres_default',
        sql="""
        CREATE TABLE IF NOT EXISTS temp_device_data (
            device_id VARCHAR(100),
            timestamp TIMESTAMP,
            battery_voltage FLOAT,
            signal_strength_dbm INTEGER,
            temperature_celsius FLOAT,
            humidity_percent FLOAT
        )
        """
    )
    
    fetch_data = PythonOperator(
        task_id='fetch_device_data',
        python_callable=fetch_device_data,
    )
    
    load_data = PythonOperator(
        task_id='load_to_postgres',
        python_callable=load_to_postgres,
    )
    
    cleanup = BashOperator(
        task_id='cleanup_temp_files',
        bash_command='rm -f /tmp/device_data.csv',
    )

    check_api >> create_temp_table >> fetch_data >> load_data >> cleanup
# dags/colocation_analysis_dag.py
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
import pandas as pd
import numpy as np
from scipy import stats

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def analyze_colocation_tests(**kwargs):
    """Analyze co-location test data to evaluate sensor accuracy"""
    try:
        # Check if postgres connection exists
        pg_hook = PostgresHook(postgres_conn_id='postgres_default')
        conn = pg_hook.get_conn()
        
        # Check if co_location_tests table exists
        cursor = conn.cursor()
        cursor.execute("""
            SELECT EXISTS (
               SELECT FROM information_schema.tables 
               WHERE table_name = 'co_location_tests'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            print("Table co_location_tests does not exist. Creating a sample table for testing.")
            # Create a sample table for testing
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS co_location_tests (
                    test_id SERIAL PRIMARY KEY,
                    primary_device_id VARCHAR(100) NOT NULL,
                    reference_device_id VARCHAR(100) NOT NULL,
                    start_date TIMESTAMP NOT NULL,
                    end_date TIMESTAMP,
                    test_location VARCHAR(100),
                    test_status VARCHAR(20) DEFAULT 'Active',
                    temperature_correlation FLOAT,
                    humidity_correlation FLOAT,
                    temperature_difference FLOAT,
                    humidity_difference FLOAT,
                    sample_count INTEGER,
                    calibration_required BOOLEAN,
                    last_analyzed TIMESTAMP
                )
            """)
            
            # Create maintenance_schedule table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS maintenance_schedule (
                    id SERIAL PRIMARY KEY,
                    device_id VARCHAR(100) NOT NULL,
                    scheduled_date TIMESTAMP NOT NULL,
                    maintenance_type VARCHAR(50) NOT NULL,
                    priority INTEGER,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(device_id, scheduled_date)
                )
            """)
            
            conn.commit()
            print("Tables created successfully.")
            return {"status": "tables_created", "message": "Required tables created. Add test data and run again."}
        
        # Original analysis code
        # Get active co-location tests
        print("Querying for active co-location tests...")
        query = """
        SELECT 
            t.test_id,
            t.primary_device_id,
            t.reference_device_id,
            t.start_date,
            t.end_date,
            t.test_location
        FROM co_location_tests t
        WHERE t.test_status = 'Active'
          AND t.start_date <= NOW()
          AND (t.end_date IS NULL OR t.end_date >= NOW())
        """
        
        active_tests = pd.read_sql(query, conn)
        print(f"Found {len(active_tests)} active co-location tests")
        
        if active_tests.empty:
            print("No active co-location tests found. Analysis complete.")
            return {"status": "success", "message": "No active tests to analyze"}
        
        # Rest of the original analysis code
        results = []
        for _, test in active_tests.iterrows():
            # Process each test...
            # [Original code continues]
            pass
        
        return {"status": "success", "tests_analyzed": len(results)}
        
    except Exception as e:
        import traceback
        print(f"Error in analyze_colocation_tests: {str(e)}")
        print(traceback.format_exc())
        raise

with DAG(
    'colocation_test_analysis',
    default_args=default_args,
    description='Analyze co-location tests to evaluate sensor accuracy',
    schedule_interval=timedelta(days=1),
    start_date=datetime(2025, 3, 1),
    catchup=False,
    tags=['airqo', 'colocation', 'calibration'],
) as dag:
    
    analyze_tests = PythonOperator(
        task_id='analyze_colocation_tests',
        python_callable=analyze_colocation_tests,
    )
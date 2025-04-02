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
    pg_hook = PostgresHook(postgres_conn_id='postgres_default')
    conn = pg_hook.get_conn()
    
    # Get active co-location tests
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
    
    results = []
    for _, test in active_tests.iterrows():
        # Get readings from both devices during the test period
        readings_query = """
        SELECT 
            d.device_id,
            s.timestamp,
            s.temperature_celsius,
            s.humidity_percent,
            s.battery_voltage,
            s.signal_strength_dbm
        FROM fact_device_status s
        JOIN dim_device d ON s.device_key = d.device_key
        WHERE d.device_id IN (%s, %s)
          AND s.timestamp BETWEEN %s AND COALESCE(%s, NOW())
        ORDER BY s.timestamp
        """
        
        readings = pd.read_sql(readings_query, conn, params=[
            test['primary_device_id'],
            test['reference_device_id'],
            test['start_date'],
            test['end_date']
        ])
        
        # Separate primary and reference device readings
        primary = readings[readings['device_id'] == test['primary_device_id']]
        reference = readings[readings['device_id'] == test['reference_device_id']]
        
        # Resample to ensure timestamps match
        primary_resampled = primary.set_index('timestamp').resample('1H').mean()
        reference_resampled = reference.set_index('timestamp').resample('1H').mean()
        
        # Merge on timestamp
        combined = pd.merge(
            primary_resampled, 
            reference_resampled, 
            left_index=True, 
            right_index=True,
            suffixes=('_primary', '_reference')
        )
        
        # Calculate correlation coefficients and differences
        if not combined.empty and len(combined) > 5:
            temp_corr, _ = stats.pearsonr(
                combined['temperature_celsius_primary'].dropna(), 
                combined['temperature_celsius_reference'].dropna()
            )
            
            humidity_corr, _ = stats.pearsonr(
                combined['humidity_percent_primary'].dropna(), 
                combined['humidity_percent_reference'].dropna()
            )
            
            # Calculate mean absolute differences
            temp_diff = np.mean(np.abs(
                combined['temperature_celsius_primary'] - combined['temperature_celsius_reference']
            ))
            
            humidity_diff = np.mean(np.abs(
                combined['humidity_percent_primary'] - combined['humidity_percent_reference']
            ))
            
            # Determine if calibration is needed
            temp_threshold = 1.0  # °C
            humidity_threshold = 5.0  # %
            
            calibration_needed = (
                temp_diff > temp_threshold or 
                humidity_diff > humidity_threshold or
                temp_corr < 0.9 or 
                humidity_corr < 0.9
            )
            
            results.append({
                'test_id': test['test_id'],
                'primary_device_id': test['primary_device_id'],
                'reference_device_id': test['reference_device_id'],
                'temperature_correlation': temp_corr,
                'humidity_correlation': humidity_corr,
                'temperature_difference': temp_diff,
                'humidity_difference': humidity_diff,
                'sample_count': len(combined),
                'calibration_required': calibration_needed
            })
    
    # Update database with results
    cursor = conn.cursor()
    for result in results:
        cursor.execute(
            """
            UPDATE co_location_tests
            SET 
                temperature_correlation = %s,
                humidity_correlation = %s,
                temperature_difference = %s,
                humidity_difference = %s,
                sample_count = %s,
                calibration_required = %s,
                last_analyzed = NOW()
            WHERE test_id = %s
            """,
            (
                result['temperature_correlation'],
                result['humidity_correlation'],
                result['temperature_difference'],
                result['humidity_difference'],
                result['sample_count'],
                result['calibration_required'],
                result['test_id']
            )
        )
        
        # If calibration is required, add to maintenance schedule
        if result['calibration_required']:
            cursor.execute(
                """
                INSERT INTO maintenance_schedule
                (device_id, scheduled_date, maintenance_type, priority, notes, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (device_id, scheduled_date) DO NOTHING
                """,
                (
                    result['primary_device_id'],
                    datetime.now() + timedelta(days=3),
                    'Calibration',
                    2,
                    f"Co-location test shows significant drift: Temp diff {result['temperature_difference']:.2f}°C, Humidity diff {result['humidity_difference']:.2f}%"
                )
            )
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return results

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
    
    analyze_tests
import pytest
import logging
from datetime import datetime
from unittest import mock
from airflow.models import DagBag, TaskInstance, DAG
from airflow.utils.session import create_session
from airflow.utils.state import State
from airflow.providers.postgres.hooks.postgres import PostgresHook

from dags.device_performance_analysis_dag import calculate_device_daily_metrics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestDagPostgresIntegration:
    @pytest.fixture(scope="function")
    def setup_test_data(self):
        """Setup test data in the test database"""
        pg_hook = PostgresHook(postgres_conn_id='postgres_default')
        conn = pg_hook.get_conn()
        cursor = conn.cursor()
        
        try:
            # Create necessary tables
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS dim_device (
                    device_key SERIAL PRIMARY KEY,
                    device_id VARCHAR(100) UNIQUE,
                    is_active BOOLEAN DEFAULT true
                );
                CREATE TABLE IF NOT EXISTS fact_device_readings (
                    reading_key SERIAL PRIMARY KEY,
                    device_key INTEGER REFERENCES dim_device(device_key),
                    timestamp TIMESTAMP WITH TIME ZONE,
                    pm2_5 DECIMAL(10, 5),
                    pm10 DECIMAL(10, 5),
                    battery_voltage DECIMAL(5, 2)
                );
                CREATE TABLE IF NOT EXISTS device_daily_metrics (
                    id SERIAL PRIMARY KEY,
                    device_key INTEGER,
                    device_id VARCHAR(100),
                    date DATE,
                    uptime FLOAT,
                    data_completeness FLOAT,
                    readings_count INTEGER,
                    expected_readings INTEGER,
                    avg_battery_voltage FLOAT,
                    calculated_at TIMESTAMP
                );
            """)
            
            # Insert test device
            cursor.execute("""
                INSERT INTO dim_device (device_id, is_active)
                VALUES ('test-device-integration', true);
            """)
            
            # Get the device_key
            cursor.execute("SELECT device_key FROM dim_device WHERE device_id = 'test-device-integration'")
            device_key = cursor.fetchone()[0]
            
            # Insert test readings
            current_time = datetime.now()
            for hour in range(24):
                timestamp = current_time.replace(hour=hour, minute=0, second=0)
                cursor.execute("""
                    INSERT INTO fact_device_readings 
                    (device_key, timestamp, pm2_5, pm10, battery_voltage)
                    VALUES (%s, %s, %s, %s, %s)
                """, (device_key, timestamp, 10.5, 20.5, 3.8))
            
            conn.commit()
            yield device_key
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Error setting up test data: {e}")
            raise
        finally:
            # Clean up the test data
            cursor.execute("DELETE FROM device_daily_metrics")
            cursor.execute("DELETE FROM fact_device_readings")
            cursor.execute("DELETE FROM dim_device")
            conn.commit()
            cursor.close()
            conn.close()
    
    def test_calculate_device_daily_metrics(self, setup_test_data):
        """Test the daily metrics calculation with real database"""
        device_key = setup_test_data
        
        # Create a mock context
        ti = mock.MagicMock()
        ti.xcom_pull.return_value = None
        mock_context = {'ti': ti}
        
        # Run the task function
        result = calculate_device_daily_metrics(**mock_context)
        
        # Verify the results in the database
        pg_hook = PostgresHook(postgres_conn_id='postgres_default')
        conn = pg_hook.get_conn()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT COUNT(*) FROM device_daily_metrics 
            WHERE device_key = %s
        """, (device_key,))
        
        count = cursor.fetchone()[0]
        assert count > 0, "No metrics were saved to the database"
        
        # Check the values
        cursor.execute("""
            SELECT readings_count, expected_readings, uptime, data_completeness
            FROM device_daily_metrics
            WHERE device_key = %s
            LIMIT 1
        """, (device_key,))
        
        row = cursor.fetchone()
        assert row is not None
        readings_count, expected_readings, uptime, data_completeness = row
        
        assert readings_count == 24, "Should have 24 readings"
        assert expected_readings == 24, "Should expect 24 readings"
        assert uptime > 90, "Uptime should be high"
        assert data_completeness == 100, "Data completeness should be 100%"
        
        cursor.close()
        conn.close()
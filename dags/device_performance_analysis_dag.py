# dags/device_performance_analysis_dag.py
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from airflow.sensors.external_task import ExternalTaskSensor

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'device_performance_analysis',
    default_args=default_args,
    description='Transform raw device data into performance metrics using dbt',
    schedule_interval=timedelta(hours=1),
    start_date=datetime(2025, 3, 1),
    catchup=False,
    tags=['airqo', 'dbt', 'analytics'],
) as dag:

    # Wait for data collection DAG to complete
    wait_for_data_collection = ExternalTaskSensor(
        task_id='wait_for_data_collection',
        external_dag_id='device_data_collection',
        external_task_id='cleanup_temp_files',
        timeout=600,
        mode='reschedule',
    )
    
    # Create directory for dbt logs
    create_logs_dir = BashOperator(
        task_id='create_logs_dir',
        bash_command='mkdir -p /opt/airflow/dbt/logs && chmod -R 775 /opt/airflow/dbt/logs',
    )
    
    # Run dbt to transform raw data into daily metrics
    run_daily_metrics = BashOperator(
        task_id='run_daily_metrics',
        bash_command='cd /opt/airflow/dbt && dbt run --profiles-dir ./profiles --models device_monitoring.device_daily_metrics',
    )
    
    # Calculate device health status
    run_health_status = BashOperator(
        task_id='run_health_status',
        bash_command='cd /opt/airflow/dbt && dbt run --profiles-dir ./profiles --models device_monitoring.device_health_status',
    )
    
    # Calculate maintenance effectiveness
    run_maintenance_analysis = BashOperator(
        task_id='run_maintenance_analysis',
        bash_command='cd /opt/airflow/dbt && dbt run --profiles-dir ./profiles --models device_monitoring.maintenance_effectiveness',
    )
    
    # Run dbt tests to validate data
    run_tests = BashOperator(
        task_id='run_dbt_tests',
        bash_command='cd /opt/airflow/dbt && dbt test --profiles-dir ./profiles',
    )
    
    # Generate documentation
    generate_docs = BashOperator(
        task_id='generate_docs',
        bash_command='cd /opt/airflow/dbt && dbt docs generate --profiles-dir ./profiles',
    )

    wait_for_data_collection >> create_logs_dir >> [run_daily_metrics, run_health_status, run_maintenance_analysis] >> run_tests >> generate_docs
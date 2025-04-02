# dags/device_alerting_dag.py
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.sensors.external_task import ExternalTaskSensor
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def check_device_issues(**kwargs):
    """Check for device issues and return a list of problematic devices"""
    pg_hook = PostgresHook(postgres_conn_id='postgres_default')
    
    # Query for devices with critical status
    critical_devices = pg_hook.get_records(
        """
        SELECT d.device_id, d.device_name, s.battery_voltage, s.signal_strength_dbm,
               s.temperature_celsius, s.timestamp
        FROM device_health_status s
        JOIN dim_device d ON s.device_key = d.device_key
        WHERE s.overall_status = 'Critical'
        """
    )
    
    # Query for offline devices (no readings in last 24 hours)
    offline_devices = pg_hook.get_records(
        """
        SELECT d.device_id, d.device_name, MAX(s.timestamp) as last_seen
        FROM dim_device d
        JOIN fact_device_status s ON d.device_key = s.device_key
        GROUP BY d.device_id, d.device_name
        HAVING MAX(s.timestamp) < NOW() - INTERVAL '24 hours'
        """
    )
    
    return {
        'critical_devices': critical_devices,
        'offline_devices': offline_devices
    }

def send_alerts(**kwargs):
    """Send email alerts for problematic devices"""
    ti = kwargs['ti']
    device_issues = ti.xcom_pull(task_ids='check_device_issues')
    
    if not device_issues['critical_devices'] and not device_issues['offline_devices']:
        print("No device issues detected. No alerts to send.")
        return
    
    # Compose email
    msg = MIMEMultipart()
    msg['Subject'] = 'AirQo Device Alert - Action Required'
    msg['From'] = 'alerts@airqo.net'
    msg['To'] = 'techteam@airqo.net'
    
    email_body = "<h2>Device Alert Report</h2>"
    
    if device_issues['critical_devices']:
        email_body += "<h3>Critical Status Devices:</h3><ul>"
        for device in device_issues['critical_devices']:
            email_body += f"<li><strong>{device[1]}</strong> (ID: {device[0]}) - Battery: {device[2]}V, Signal: {device[3]}dBm, Temp: {device[4]}°C</li>"
        email_body += "</ul>"
    
    if device_issues['offline_devices']:
        email_body += "<h3>Offline Devices (>24h):</h3><ul>"
        for device in device_issues['offline_devices']:
            email_body += f"<li><strong>{device[1]}</strong> (ID: {device[0]}) - Last seen: {device[2]}</li>"
        email_body += "</ul>"
    
    msg.attach(MIMEText(email_body, 'html'))
    
    # Send email
    try:
        server = smtplib.SMTP('smtp.example.com', 587)
        server.starttls()
        server.login('alerts@airqo.net', 'password')  # Use Airflow Variables or Connections for credentials
        server.send_message(msg)
        server.quit()
        print("Alert email sent successfully")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")

with DAG(
    'device_alerting_system',
    default_args=default_args,
    description='Monitor device health and send alerts',
    schedule_interval=timedelta(hours=4),
    start_date=datetime(2025, 3, 1),
    catchup=False,
    tags=['airqo', 'monitoring', 'alerts'],
) as dag:

    # Wait for analysis to complete
    wait_for_analysis = ExternalTaskSensor(
        task_id='wait_for_analysis',
        external_dag_id='device_performance_analysis',
        external_task_id='generate_docs',
        timeout=600,
        mode='reschedule',
    )
    
    # Check for device issues
    check_issues = PythonOperator(
        task_id='check_device_issues',
        python_callable=check_device_issues,
    )
    
    # Send alerts if issues detected
    send_alert_emails = PythonOperator(
        task_id='send_alerts',
        python_callable=send_alerts,
    )

    wait_for_analysis >> check_issues >> send_alert_emails
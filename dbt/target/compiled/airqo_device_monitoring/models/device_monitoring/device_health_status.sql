-- dbt/models/device_monitoring/device_health_status.sql


WITH latest_readings AS (
    SELECT
        s.device_key,
        d.device_name,
        s.timestamp as last_reading_time,
        s.battery_voltage,
        s.signal_strength_dbm,
        ROW_NUMBER() OVER (PARTITION BY s.device_key ORDER BY s.timestamp DESC) as rn
    FROM fact_device_status s
    JOIN dim_device d ON s.device_key = d.device_key
)

SELECT
    device_key,
    device_name,
    last_reading_time,
    battery_voltage,
    signal_strength_dbm,
    CASE
        WHEN battery_voltage >= 3.7 THEN 'Good'
        WHEN battery_voltage >= 3.3 THEN 'Warning'
        ELSE 'Critical'
    END as battery_status,
    CASE
        WHEN signal_strength_dbm >= -70 THEN 'Good'
        WHEN signal_strength_dbm >= -90 THEN 'Warning'
        ELSE 'Critical'
    END as signal_status,
    CASE
        WHEN battery_voltage >= 3.7 AND signal_strength_dbm >= -70 THEN 'Healthy'
        WHEN battery_voltage < 3.3 OR signal_strength_dbm < -90 THEN 'Critical'
        ELSE 'Warning'
    END as overall_status
FROM latest_readings
WHERE rn = 1
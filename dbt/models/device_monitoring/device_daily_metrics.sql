-- dbt/models/device_monitoring/device_daily_metrics.sql
{{ config(
    materialized='table'
) }}

SELECT
    device_key,
    DATE_TRUNC('day', timestamp) as day,
    COUNT(*) as reading_count,
    AVG(battery_voltage) as avg_battery_voltage,
    MIN(battery_voltage) as min_battery_voltage,
    MAX(battery_voltage) as max_battery_voltage,
    AVG(signal_strength_dbm) as avg_signal_strength,
    MIN(signal_strength_dbm) as min_signal_strength,
    MAX(signal_strength_dbm) as max_signal_strength
FROM fact_device_status
GROUP BY device_key, DATE_TRUNC('day', timestamp)
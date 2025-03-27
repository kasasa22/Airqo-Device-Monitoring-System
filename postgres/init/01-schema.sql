-- Simplified schema for AirQo Device Health Monitoring System
-- Avoiding uuid_generate_v4() issues by using manually assigned UUIDs

-- Create schemas
CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set search path
SET search_path TO analytics;

-- 1. Devices Table
DROP TABLE IF EXISTS devices CASCADE;
CREATE TABLE devices (
    device_id UUID PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL,
    model_number VARCHAR(50) NOT NULL,
    manufacture_date TIMESTAMP NOT NULL,
    firmware_version VARCHAR(20),
    hardware_version VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    deployment_location VARCHAR(100),
    power_source_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Current State Table
DROP TABLE IF EXISTS current_state CASCADE;
CREATE TABLE current_state (
    status_id UUID PRIMARY KEY,
    device_id UUID NOT NULL,
    battery_voltage FLOAT,
    signal_strength_dbm INTEGER,
    internal_temperature FLOAT,
    memory_usage FLOAT,
    error_code VARCHAR(50),
    status_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Device Readings Table
DROP TABLE IF EXISTS device_readings CASCADE;
CREATE TABLE device_readings (
    reading_id UUID PRIMARY KEY,
    device_id UUID NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    temperature FLOAT,
    humidity FLOAT,
    pm2_5 FLOAT,
    pm10 FLOAT,
    validation_status VARCHAR(20),
    reading_quality INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Fact Device Status Table
DROP TABLE IF EXISTS fact_device_status CASCADE;
CREATE TABLE fact_device_status (
    status_key SERIAL PRIMARY KEY,
    device_key UUID NOT NULL,
    date_key DATE NOT NULL,
    time_key TIME NOT NULL,
    status_key_ref VARCHAR(20),
    battery_voltage FLOAT,
    signal_strength_dbm INTEGER,
    internal_temperature FLOAT,
    memory_usage FLOAT,
    humidity FLOAT,
    pm2_5 FLOAT,
    pm10 FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Fact Device Performance Table
DROP TABLE IF EXISTS fact_device_performance CASCADE;
CREATE TABLE fact_device_performance (
    performance_key SERIAL PRIMARY KEY,
    device_key UUID NOT NULL,
    date_key DATE NOT NULL,
    uptime_percentage FLOAT,
    downtime_minutes INTEGER,
    battery_performance_score INTEGER,
    signal_performance_score INTEGER,
    overall_health_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE current_state ADD CONSTRAINT fk_current_state_device 
    FOREIGN KEY (device_id) REFERENCES devices(device_id);

ALTER TABLE device_readings ADD CONSTRAINT fk_device_readings_device 
    FOREIGN KEY (device_id) REFERENCES devices(device_id);

ALTER TABLE fact_device_status ADD CONSTRAINT fk_fact_device_status_device 
    FOREIGN KEY (device_key) REFERENCES devices(device_id);

ALTER TABLE fact_device_performance ADD CONSTRAINT fk_fact_device_performance_device 
    FOREIGN KEY (device_key) REFERENCES devices(device_id);

-- Initialize the dim_status table with standard statuses
DROP TABLE IF EXISTS dim_status CASCADE;
CREATE TABLE dim_status (
    status_key VARCHAR(20) PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL,
    status_description TEXT,
    is_operational BOOLEAN,
    priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO dim_status (status_key, status_name, status_description, is_operational, priority_level)
VALUES
    ('ACTIVE', 'Active', 'Device is operational and collecting data normally', TRUE, 1),
    ('OFFLINE', 'Offline', 'Device is not communicating with the system', FALSE, 5),
    ('MAINTENANCE', 'In Maintenance', 'Device is undergoing scheduled maintenance', FALSE, 2),
    ('LOW_BATTERY', 'Low Battery', 'Device battery level is critically low', TRUE, 4),
    ('POOR_SIGNAL', 'Poor Signal', 'Device has weak cellular signal strength', TRUE, 3),
    ('ERROR', 'Error State', 'Device is reporting an error condition', FALSE, 5),
    ('CALIBRATION', 'In Calibration', 'Device is undergoing calibration process', FALSE, 2);

-- Create date dimension table
DROP TABLE IF EXISTS dim_date CASCADE;
CREATE TABLE dim_date (
    date_key DATE PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    is_holiday BOOLEAN NOT NULL,
    season VARCHAR(10)
);

-- Insert some sample dates
INSERT INTO dim_date (date_key, year, month, day, quarter, day_of_week, is_weekend, is_holiday, season)
VALUES
    ('2023-03-01', 2023, 3, 1, 1, 3, FALSE, FALSE, 'Spring'),
    ('2023-03-02', 2023, 3, 2, 1, 4, FALSE, FALSE, 'Spring'),
    ('2023-03-03', 2023, 3, 3, 1, 5, FALSE, FALSE, 'Spring'),
    ('2023-03-04', 2023, 3, 4, 1, 6, TRUE, FALSE, 'Spring'),
    ('2023-03-05', 2023, 3, 5, 1, 0, TRUE, FALSE, 'Spring');

-- Create a device status view
DROP VIEW IF EXISTS device_status_view;
CREATE OR REPLACE VIEW device_status_view AS
SELECT 
    d.device_id,
    d.device_name,
    d.model_number,
    d.deployment_location,
    cs.battery_voltage,
    cs.signal_strength_dbm,
    cs.internal_temperature,
    cs.error_code,
    cs.status_timestamp,
    CASE 
        WHEN cs.battery_voltage < 3.2 THEN 'LOW_BATTERY'
        WHEN cs.signal_strength_dbm < -90 THEN 'POOR_SIGNAL'
        WHEN cs.error_code IS NOT NULL THEN 'ERROR'
        WHEN d.is_active = false THEN 'OFFLINE'
        ELSE 'ACTIVE'
    END as device_status
FROM 
    devices d
LEFT JOIN 
    current_state cs ON d.device_id = cs.device_id;
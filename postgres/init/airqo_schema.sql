-- Creating the dimension tables first

-- DIM_Device table
CREATE TABLE IF NOT EXISTS DIM_Device (
    device_key SERIAL PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50),
    manufacture_date TIMESTAMP,
    description TEXT,
    hardware_version VARCHAR(50),
    firmware_version VARCHAR(50),
    power_system_type VARCHAR(50),
    communication_module_type VARCHAR(50),
    is_currently_active BOOLEAN DEFAULT TRUE
);

-- DIM_Status table
CREATE TABLE IF NOT EXISTS DIM_Status (
    status_key SERIAL PRIMARY KEY,
    status_code VARCHAR(20) NOT NULL,
    status_description TEXT,
    security_level INTEGER,
    requires_action BOOLEAN DEFAULT FALSE,
    recommended_action TEXT,
    alert_category VARCHAR(50)
);

-- DIM_Date table
CREATE TABLE IF NOT EXISTS DIM_Date (
    date_key SERIAL PRIMARY KEY,
    full_date DATE NOT NULL,
    month INTEGER,
    quarter INTEGER,
    year INTEGER,
    day_of_week VARCHAR(10),
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    season VARCHAR(20)
);

-- DIM_Location table
CREATE TABLE IF NOT EXISTS DIM_Location (
    location_key SERIAL PRIMARY KEY,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    site_name VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100),
    installation_height DECIMAL(5, 2),
    mounting_type VARCHAR(50),
    power_availability VARCHAR(50),
    network_coverage_type VARCHAR(50),
    environmental_zone VARCHAR(50)
);

-- Creating the fact tables

-- FACT_device_status table
CREATE TABLE IF NOT EXISTS FACT_device_status (
    id SERIAL PRIMARY KEY,
    device_key INTEGER REFERENCES DIM_Device(device_key),
    status_key INTEGER REFERENCES DIM_Status(status_key),
    date_key INTEGER REFERENCES DIM_Date(date_key),
    timestamp TIMESTAMP NOT NULL,
    battery_voltage DECIMAL(5, 2),
    signal_strength_dbm INTEGER,
    temperature_celsius DECIMAL(5, 2),
    humidity_percent DECIMAL(5, 2),
    power_source_type VARCHAR(50),
    memory_usage_percent DECIMAL(5, 2),
    storage_usage_percent DECIMAL(5, 2),
    error_code VARCHAR(50),
    transmission_latency INTEGER
);

-- FACT_Device_Performance table
CREATE TABLE IF NOT EXISTS FACT_Device_Performance (
    id SERIAL PRIMARY KEY,
    device_key INTEGER REFERENCES DIM_Device(device_key),
    date_key INTEGER REFERENCES DIM_Date(date_key),
    uptime_minutes INTEGER,
    downtime_minutes INTEGER,
    device_count INTEGER,
    battery_voltage_min DECIMAL(5, 2),
    battery_voltage_max DECIMAL(5, 2),
    battery_voltage_avg DECIMAL(5, 2),
    signal_strength_min INTEGER,
    signal_strength_max INTEGER,
    signal_strength_avg DECIMAL(5, 2),
    transmission_success_rate DECIMAL(5, 2),
    temperature_min DECIMAL(5, 2),
    temperature_max DECIMAL(5, 2),
    temperature_avg DECIMAL(5, 2),
    humidity_min DECIMAL(5, 2),
    humidity_max DECIMAL(5, 2),
    humidity_avg DECIMAL(5, 2),
    power_source_changes INTEGER,
    data_packets_sent INTEGER,
    data_packets_received INTEGER
);

-- FACT_Maintenance table
CREATE TABLE IF NOT EXISTS FACT_Maintenance (
    id SERIAL PRIMARY KEY,
    device_key INTEGER REFERENCES DIM_Device(device_key),
    date_key INTEGER REFERENCES DIM_Date(date_key),
    maintenance_duration_minutes INTEGER,
    components_replaced TEXT,
    maintenance_cost DECIMAL(10, 2),
    pre_maintenance_uptime_percent DECIMAL(5, 2),
    field_visit_success_rating INTEGER,
    time_execution_time INTEGER
);

-- FACT_Correlation table
CREATE TABLE IF NOT EXISTS FACT_Correlation (
    device_key INTEGER REFERENCES DIM_Device(device_key),
    date_key INTEGER REFERENCES DIM_Date(date_key),
    location_key INTEGER REFERENCES DIM_Location(location_key),
    pm_difference DECIMAL(10, 4),
    device_difference DECIMAL(10, 4),
    temperature_difference DECIMAL(5, 2),
    humidity_difference DECIMAL(5, 2),
    voltage_difference DECIMAL(5, 2),
    signal_strength_difference INTEGER,
    correlation_coeff_percent DECIMAL(5, 2),
    PRIMARY KEY (device_key, date_key, location_key)
);

-- Create indexes for better query performance
CREATE INDEX idx_fact_device_status_device ON FACT_device_status(device_key);
CREATE INDEX idx_fact_device_status_date ON FACT_device_status(date_key);
CREATE INDEX idx_fact_device_performance_device ON FACT_Device_Performance(device_key);
CREATE INDEX idx_fact_device_performance_date ON FACT_Device_Performance(date_key);
CREATE INDEX idx_fact_maintenance_device ON FACT_Maintenance(device_key);
CREATE INDEX idx_fact_correlation_device ON FACT_Correlation(device_key);
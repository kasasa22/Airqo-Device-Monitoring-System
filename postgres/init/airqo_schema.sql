-- Complete schema with updates for AirQo data pipeline

-- DIM_Device table - Enhanced to match API response fields
CREATE TABLE IF NOT EXISTS DIM_Device (
   device_key SERIAL PRIMARY KEY,
   device_id VARCHAR(100) UNIQUE NOT NULL,   -- Maps to _id in API
   device_name VARCHAR(100) NOT NULL,        -- Maps to name in API
   long_name VARCHAR(100),                   -- Maps to long_name in API
   alias VARCHAR(100),                       -- Maps to alias in API
   network VARCHAR(50),                      -- Maps to network in API
   category VARCHAR(50),                     -- Maps to category in API  
   serial_number VARCHAR(100),               -- Maps to serial_number in API
   status VARCHAR(50),                       -- Maps to status in API
   is_active BOOLEAN DEFAULT FALSE,          -- Maps to isActive in API
   is_online BOOLEAN DEFAULT FALSE,          -- Maps to isOnline in API
   is_primary_in_location BOOLEAN DEFAULT FALSE, -- Maps to isPrimaryInLocation in API
   mobility BOOLEAN DEFAULT FALSE,           -- Maps to mobility in API
   visibility BOOLEAN DEFAULT TRUE,          -- Maps to visibility in API
   height DECIMAL(5, 2),                     -- Maps to height in API
   mount_type VARCHAR(50),                   -- Maps to mountType in API
   power_type VARCHAR(50),                   -- Maps to powerType in API
   next_maintenance TIMESTAMP,               -- Maps to nextMaintenance in API
   deployment_date TIMESTAMP,                -- Maps to deployment_date in API
   description TEXT,                         -- Maps to description in API
   device_number INTEGER,                    -- Maps to device_number in API
   auth_required BOOLEAN DEFAULT FALSE,      -- Maps to authRequired in API
   created_at TIMESTAMP,                     -- Maps to createdAt in API
   groups TEXT[],                            -- Maps to groups array in API
   device_codes TEXT[],                      -- Maps to device_codes array in API
   first_seen TIMESTAMP,                     -- Custom field for tracking
   last_updated TIMESTAMP,                   -- Custom field for tracking
   write_key VARCHAR(255),                   -- Maps to writeKey in API
   read_key VARCHAR(255),                    -- Maps to readKey in API
   cohorts TEXT[],                           -- Maps to cohorts array in API
   previous_sites TEXT[],                    -- Maps to previous_sites array in API
   grids JSONB,                              -- Maps to grids array with nested objects in API
   last_active TIMESTAMP,                    -- Maps to lastActive in API
   site JSONB,                               -- Store the complete site object as JSON
   approximate_distance_in_km DECIMAL(10, 2), -- Maps to approximate_distance_in_km in API
   bearing_in_radians DECIMAL(10, 6)         -- Maps to bearing_in_radians in API
);

-- DIM_Location table - Modified to align with the Airflow DAG
CREATE TABLE IF NOT EXISTS DIM_Location (
   location_key SERIAL PRIMARY KEY,
   device_key INTEGER REFERENCES DIM_Device(device_key),
   location_name VARCHAR(255),             -- Maps to site.location_name in API
   search_name VARCHAR(255),               -- Maps to site.search_name in API
   village VARCHAR(255),                   -- Maps to site.village in API
   latitude DECIMAL(10, 7),                -- Maps to latitude in API
   longitude DECIMAL(10, 7),               -- Maps to longitude in API
   admin_level_country VARCHAR(100),       -- Derived from grids with admin_level = 'country'
   admin_level_city VARCHAR(100),          -- Derived from grids with admin_level = 'city'
   admin_level_division VARCHAR(100),      -- Derived from grids with admin_level = 'division'
   site_category VARCHAR(100),             -- Maps to site.site_category.category in API
   mount_type VARCHAR(50),                 -- Maps to mountType in API
   power_type VARCHAR(50),                 -- Maps to powerType in API
   site_id VARCHAR(100),                   -- Maps to site._id in API
   site_name VARCHAR(255),                 -- Maps to site.name in API
   deployment_date TIMESTAMP,              -- Maps to deployment_date in API
   effective_from TIMESTAMP,               -- Start date of this location record validity
   effective_to TIMESTAMP,                 -- End date of this location record validity
   is_active BOOLEAN DEFAULT TRUE,         -- Whether this is the current active location for the device
   recorded_at TIMESTAMP,                  -- Timestamp when location was recorded
   data_provider VARCHAR(50),              -- Maps to site.data_provider in API
   approximate_distance_in_km DECIMAL(10, 2), -- Maps to approximate_distance_in_km in API
   bearing_in_radians DECIMAL(10, 6),      -- Maps to bearing_in_radians in API
   is_online BOOLEAN DEFAULT FALSE,        -- Maps to site.isOnline in API
   last_active TIMESTAMP,                  -- Maps to site.lastActive in API
   groups TEXT[],                          -- Maps to site.groups array in API
   
   -- Add constraint to ensure only one active record per device
   UNIQUE(device_key, is_active) WHERE is_active = true
);

-- DIM_Status table - Keep as is for status categorization
CREATE TABLE IF NOT EXISTS DIM_Status (
   status_key SERIAL PRIMARY KEY,
   status_code VARCHAR(20) NOT NULL,
   status_description TEXT,
   security_level INTEGER,
   requires_action BOOLEAN DEFAULT FALSE,
   recommended_action TEXT,
   alert_category VARCHAR(50)
);

-- DIM_Date table - Keep as is for time dimension
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

-- FACT_device_status table - Adjusted to simplify and focus on device telemetry
CREATE TABLE IF NOT EXISTS FACT_device_status (
   status_key SERIAL PRIMARY KEY,
   device_key INTEGER REFERENCES DIM_Device(device_key),
   timestamp TIMESTAMP NOT NULL,
   is_online BOOLEAN,                      -- Current online status
   device_status VARCHAR(50),              -- Current device status (deployed, not deployed, etc.)
   battery_voltage DECIMAL(5, 2),          -- From device telemetry
   signal_strength_dbm INTEGER,            -- From device telemetry
   temperature_celsius DECIMAL(5, 2),      -- From device telemetry
   humidity_percent DECIMAL(5, 2),         -- From device telemetry
   memory_usage_percent DECIMAL(5, 2),     -- If available in telemetry
   error_code VARCHAR(50)                  -- Any error reported
);

-- FACT_Device_Readings table - New table for actual air quality readings
CREATE TABLE IF NOT EXISTS FACT_device_readings (
   reading_key SERIAL PRIMARY KEY,
   device_key INTEGER REFERENCES DIM_Device(device_key),
   timestamp TIMESTAMP NOT NULL,
   battery_voltage DECIMAL(5, 2),
   signal_strength_dbm INTEGER,
   temperature_celsius DECIMAL(5, 2),
   humidity_percent DECIMAL(5, 2),
   pm2_5 DECIMAL(7, 2),                    -- PM2.5 reading
   pm10 DECIMAL(7, 2),                     -- PM10 reading
   pm1 DECIMAL(7, 2),                      -- PM1 reading if available
   no2 DECIMAL(7, 2),                      -- NO2 reading if available
   o3 DECIMAL(7, 2)                        -- O3 reading if available
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
   maintenance_date TIMESTAMP,
   maintenance_duration_minutes INTEGER,
   components_replaced TEXT,
   maintenance_cost DECIMAL(10, 2),
   pre_maintenance_uptime_percent DECIMAL(5, 2),
   post_maintenance_uptime_percent DECIMAL(5, 2),
   field_visit_success_rating INTEGER,
   time_execution_time INTEGER
);

-- FACT_Correlation table
CREATE TABLE IF NOT EXISTS FACT_Correlation (
   id SERIAL PRIMARY KEY,
   device_key INTEGER REFERENCES DIM_Device(device_key),
   reference_device_key INTEGER REFERENCES DIM_Device(device_key),
   date_key INTEGER REFERENCES DIM_Date(date_key),
   location_key INTEGER REFERENCES DIM_Location(location_key),
   pm_difference DECIMAL(10, 4),
   device_difference DECIMAL(10, 4),
   temperature_difference DECIMAL(5, 2),
   humidity_difference DECIMAL(5, 2),
   voltage_difference DECIMAL(5, 2),
   signal_strength_difference INTEGER,
   correlation_coeff_percent DECIMAL(5, 2)
);

-- Create indexes for better query performance
CREATE INDEX idx_dim_device_id ON DIM_Device(device_id);
CREATE INDEX idx_dim_device_network ON DIM_Device(network);
CREATE INDEX idx_dim_device_status ON DIM_Device(status);
CREATE INDEX idx_dim_device_is_active ON DIM_Device(is_active);
CREATE INDEX idx_dim_device_is_online ON DIM_Device(is_online);

-- Updated indexes for DIM_Location
CREATE INDEX idx_dim_location_device_key ON DIM_Location(device_key);
CREATE INDEX idx_dim_location_is_active ON DIM_Location(device_key, is_active);
CREATE INDEX idx_dim_location_coords ON DIM_Location(latitude, longitude);
CREATE INDEX idx_dim_location_site_id ON DIM_Location(site_id);
CREATE INDEX idx_dim_location_admin_levels ON DIM_Location(admin_level_country, admin_level_city, admin_level_division);

CREATE INDEX idx_fact_device_status_device ON FACT_device_status(device_key);
CREATE INDEX idx_fact_device_status_timestamp ON FACT_device_status(timestamp);

CREATE INDEX idx_fact_device_readings_device ON FACT_device_readings(device_key);
CREATE INDEX idx_fact_device_readings_timestamp ON FACT_device_readings(timestamp);

CREATE INDEX idx_fact_device_performance_device ON FACT_Device_Performance(device_key);
CREATE INDEX idx_fact_device_performance_date ON FACT_Device_Performance(date_key);

CREATE INDEX idx_fact_maintenance_device ON FACT_Maintenance(device_key);
CREATE INDEX idx_fact_correlation_device ON FACT_Correlation(device_key);
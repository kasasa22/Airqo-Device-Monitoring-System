-- Sample data insertion script for AirQo Device Health Monitoring System
SET search_path TO analytics;

-- Insert sample devices
INSERT INTO devices (device_id, device_name, model_number, manufacture_date, firmware_version, hardware_version, is_active, deployment_location, power_source_type)
VALUES
    ('6c9a9478-c0c1-4a0f-8a17-a69b2cd732a9', 'AirQo-001', 'AQ-2023-M1', '2023-01-15 00:00:00', 'v1.2.3', 'v2.0', true, 'Kampala Central', 'Solar'),
    ('a8b7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d', 'AirQo-002', 'AQ-2023-M1', '2023-01-16 00:00:00', 'v1.2.3', 'v2.0', true, 'Kampala East', 'Solar'),
    ('b2c3d4e5-f6g7-4a2b-9c8d-l2m3n4o5p6q7', 'AirQo-003', 'AQ-2023-M1', '2023-01-17 00:00:00', 'v1.2.3', 'v2.0', true, 'Kampala West', 'Battery'),
    ('c3d4e5f6-g7h8-4a2b-9c8d-m3n4o5p6q7r8', 'AirQo-004', 'AQ-2023-M1', '2023-01-18 00:00:00', 'v1.2.3', 'v2.0', false, 'Kampala North', 'Solar'),
    ('d4e5f6g7-h8i9-4a2b-9c8d-n4o5p6q7r8s9', 'AirQo-005', 'AQ-2023-M2', '2023-01-19 00:00:00', 'v1.3.0', 'v2.1', true, 'Kampala South', 'Solar');

-- Reset and start with valid UUIDs
TRUNCATE TABLE devices CASCADE;

INSERT INTO devices (device_id, device_name, model_number, manufacture_date, firmware_version, hardware_version, is_active, deployment_location, power_source_type)
VALUES
    ('6c9a9478-c0c1-4a0f-8a17-a69b2cd732a9', 'AirQo-001', 'AQ-2023-M1', '2023-01-15 00:00:00', 'v1.2.3', 'v2.0', true, 'Kampala Central', 'Solar'),
    ('a8b7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d', 'AirQo-002', 'AQ-2023-M1', '2023-01-16 00:00:00', 'v1.2.3', 'v2.0', true, 'Kampala East', 'Solar'),
    ('b2c3d4e5-e4f3-4a2b-9c8d-l2m3n4o5p6q7', 'AirQo-003', 'AQ-2023-M1', '2023-01-17 00:00:00', 'v1.2.3', 'v2.0', true, 'Kampala West', 'Battery'),
    ('c3d4e5f6-e4f3-4a2b-9c8d-m3n4o5p6q7r8', 'AirQo-004', 'AQ-2023-M1', '2023-01-18 00:00:00', 'v1.2.3', 'v2.0', false, 'Kampala North', 'Solar'),
    ('d4e5f6g7-e4f3-4a2b-9c8d-n4o5p6q7r8s9', 'AirQo-005', 'AQ-2023-M2', '2023-01-19 00:00:00', 'v1.3.0', 'v2.1', true, 'Kampala South', 'Solar');

-- Insert sample device states
INSERT INTO current_state (status_id, device_id, battery_voltage, signal_strength_dbm, internal_temperature, memory_usage, error_code, status_timestamp)
VALUES
    ('aa1e4567-e89b-12d3-a456-426614174000', '6c9a9478-c0c1-4a0f-8a17-a69b2cd732a9', 4.2, -72, 35.2, 45.3, NULL, '2023-03-01 10:15:00'),
    ('bb1e4567-e89b-12d3-a456-426614174001', 'a8b7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d', 3.8, -85, 36.1, 42.8, NULL, '2023-03-01 10:15:00'),
    ('cc1e4567-e89b-12d3-a456-426614174002', 'b2c3d4e5-e4f3-4a2b-9c8d-l2m3n4o5p6q7', 3.5, -65, 34.8, 38.2, NULL, '2023-03-01 10:15:00'),
    ('dd1e4567-e89b-12d3-a456-426614174003', 'c3d4e5f6-e4f3-4a2b-9c8d-m3n4o5p6q7r8', 2.9, -92, 32.1, 55.6, 'LOW_BATTERY', '2023-03-01 10:15:00'),
    ('ee1e4567-e89b-12d3-a456-426614174004', 'd4e5f6g7-e4f3-4a2b-9c8d-n4o5p6q7r8s9', 4.1, -78, 33.5, 41.2, NULL, '2023-03-01 10:15:00');

-- Insert sample device readings
INSERT INTO device_readings (reading_id, device_id, timestamp, temperature, humidity, pm2_5, pm10, validation_status, reading_quality)
VALUES
    ('123e4567-e89b-12d3-a456-426614174000', '6c9a9478-c0c1-4a0f-8a17-a69b2cd732a9', '2023-03-01 08:00:00', 27.5, 65.2, 12.3, 25.7, 'valid', 92),
    ('223e4567-e89b-12d3-a456-426614174001', '6c9a9478-c0c1-4a0f-8a17-a69b2cd732a9', '2023-03-01 09:00:00', 28.1, 63.8, 13.5, 27.2, 'valid', 90),
    ('323e4567-e89b-12d3-a456-426614174002', '6c9a9478-c0c1-4a0f-8a17-a69b2cd732a9', '2023-03-01 10:00:00', 29.2, 62.1, 15.0, 30.1, 'valid', 88),
    ('423e4567-e89b-12d3-a456-426614174003', 'a8b7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d', '2023-03-01 08:00:00', 26.8, 68.5, 10.2, 22.5, 'valid', 95),
    ('523e4567-e89b-12d3-a456-426614174004', 'a8b7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d', '2023-03-01 09:00:00', 27.3, 67.1, 11.8, 24.3, 'valid', 93),
    ('623e4567-e89b-12d3-a456-426614174005', 'a8b7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d', '2023-03-01 10:00:00', 28.0, 65.8, 12.5, 26.0, 'valid', 91),
    ('723e4567-e89b-12d3-a456-426614174006', 'b2c3d4e5-e4f3-4a2b-9c8d-l2m3n4o5p6q7', '2023-03-01 08:00:00', 25.9, 70.2, 9.5, 20.1, 'valid', 97),
    ('823e4567-e89b-12d3-a456-426614174007', 'b2c3d4e5-e4f3-4a2b-9c8d-l2m3n4o5p6q7', '2023-03-01 09:00:00', 26.5, 68.9, 10.8, 22.0, 'valid', 94),
    ('923e4567-e89b-12d3-a456-426614174008', 'c3d4e5f6-e4f3-4a2b-9c8d-m3n4o5p6q7r8', '2023-03-01 08:00:00', 28.7, 61.5, 16.2, 32.5, 'suspicious', 75),
    ('023e4567-e89b-12d3-a456-426614174009', 'd4e5f6g7-e4f3-4a2b-9c8d-n4o5p6q7r8s9', '2023-03-01 08:00:00', 27.0, 66.8, 11.5, 23.8, 'valid', 89);

-- Insert fact device status records
INSERT INTO fact_device_status (device_key, date_key, time_key, status_key_ref, battery_voltage, signal_strength_dbm, internal_temperature, humidity, pm2_5, pm10)
VALUES
    ('6c9a9478-c0c1-4a0f-8a17-a69b2cd732a9', '2023-03-01', '10:00:00', 'ACTIVE', 4.2, -72, 35.2, 62.1, 15.0, 30.1),
    ('a8b7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d', '2023-03-01', '10:00:00', 'ACTIVE', 3.8, -85, 36.1, 65.8, 12.5, 26.0),
    ('b2c3d4e5-e4f3-4a2b-9c8d-l2m3n4o5p6q7', '2023-03-01', '09:00:00', 'ACTIVE', 3.5, -65, 34.8, 68.9, 10.8, 22.0),
    ('c3d4e5f6-e4f3-4a2b-9c8d-m3n4o5p6q7r8', '2023-03-01', '08:00:00', 'LOW_BATTERY', 2.9, -92, 32.1, 61.5, 16.2, 32.5),
    ('d4e5f6g7-e4f3-4a2b-9c8d-n4o5p6q7r8s9', '2023-03-01', '08:00:00', 'ACTIVE', 4.1, -78, 33.5, 66.8, 11.5, 23.8);

-- Insert fact device performance records
INSERT INTO fact_device_performance (device_key, date_key, uptime_percentage, downtime_minutes, battery_performance_score, signal_performance_score, overall_health_score)
VALUES
    ('6c9a9478-c0c1-4a0f-8a17-a69b2cd732a9', '2023-03-01', 99.8, 2.88, 95, 85, 92),
    ('a8b7c6d5-e4f3-4a2b-9c8d-7e6f5a4b3c2d', '2023-03-01', 98.5, 21.6, 85, 70, 80),
    ('b2c3d4e5-e4f3-4a2b-9c8d-l2m3n4o5p6q7', '2023-03-01', 99.2, 11.52, 75, 90, 85),
    ('c3d4e5f6-e4f3-4a2b-9c8d-m3n4o5p6q7r8', '2023-03-01', 95.0, 72.0, 40, 60, 52),
    ('d4e5f6g7-e4f3-4a2b-9c8d-n4o5p6q7r8s9', '2023-03-01', 97.5, 36.0, 90, 75, 83);
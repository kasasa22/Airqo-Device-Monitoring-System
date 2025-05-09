-- Test to ensure critical columns in fact_device_readings are not null
-- Returns records that fail the test condition

SELECT *
FROM {{ ref('fact_device_readings') }}
WHERE 
    device_key IS NULL
    OR timestamp IS NULL
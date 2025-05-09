-- Test to ensure key combinations are unique
-- Returns records that fail the test condition

SELECT
    device_key,
    timestamp,
    COUNT(*) as record_count
FROM {{ ref('fact_device_readings') }}
GROUP BY 
    device_key,
    timestamp
HAVING COUNT(*) > 1
-- Test to ensure PM readings are within valid range
-- Returns records that fail the test condition

SELECT *
FROM {{ ref('fact_device_readings') }}
WHERE 
    (pm2_5 IS NOT NULL AND (pm2_5 < 0 OR pm2_5 > 1000))
    OR (pm10 IS NOT NULL AND (pm10 < 0 OR pm10 > 2000))
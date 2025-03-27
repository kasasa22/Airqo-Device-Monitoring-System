-- This model creates the fact_device_status table by joining current device state with device readings

with device_state as (
    select * from {{ ref('stg_current_state') }}
),

readings as (
    select * from {{ ref('stg_device_readings') }}
),

devices as (
    select * from {{ ref('stg_devices') }}
),

-- Extract the date and time for joining with date dimension
formatted_readings as (
    select
        reading_id,
        device_id,
        timestamp,
        date(timestamp) as date_key,
        cast(timestamp as time) as time_key,
        temperature,
        humidity,
        pm2_5,
        pm10,
        validation_status,
        reading_quality
    from readings
),

-- Join with the latest state information for each device
combined as (
    select
        r.reading_id,
        r.device_id as device_key,
        r.date_key,
        r.time_key,
        -- This would typically join to a location tracking table
        -- using d.deployment_location, but for now we'll use NULL
        NULL as location_key,
        -- Status would be determined by business logic, for now we'll use 'ACTIVE' if the device is active
        case when d.is_active then 'ACTIVE' else 'OFFLINE' end as status_key_ref,
        s.battery_voltage,
        s.signal_strength_dbm,
        s.internal_temperature,
        s.memory_usage,
        r.humidity,
        r.pm2_5,
        r.pm10,
        current_timestamp as created_at
    from formatted_readings r
    inner join devices d on r.device_id = d.device_id
    left join device_state s on r.device_id = s.device_id
    -- This where clause would include logic to get only recent readings 
    -- For example: where r.timestamp > (current_timestamp - interval '24 hours')
)

select * from combined
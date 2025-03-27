-- This model calculates device performance metrics based on status and readings

with device_status as (
    select 
        device_key,
        date_key,
        status_key_ref,
        battery_voltage,
        signal_strength_dbm
    from "airflow"."public"."fact_device_status"
),

-- Calculate uptime for each device by date
uptime_calculation as (
    select
        device_key,
        date_key,
        -- Count how many readings we have where the device was active
        count(case when status_key_ref = 'ACTIVE' then 1 end) as active_readings,
        -- Count total readings
        count(*) as total_readings,
        -- Calculate uptime percentage
        (count(case when status_key_ref = 'ACTIVE' then 1 end)::float / 
         nullif(count(*), 0)::float) * 100 as uptime_percentage,
        -- Calculate downtime in minutes (simplified - would normally be more complex)
        (24 * 60) * (1 - (count(case when status_key_ref = 'ACTIVE' then 1 end)::float / 
                          nullif(count(*), 0)::float)) as downtime_minutes,
        -- Calculate average battery voltage for the day
        avg(battery_voltage) as avg_battery_voltage,
        -- Calculate average signal strength for the day
        avg(signal_strength_dbm) as avg_signal_strength
    from device_status
    group by device_key, date_key
),

-- Calculate performance scores based on metrics
performance_scores as (
    select
        device_key,
        date_key,
        uptime_percentage,
        downtime_minutes,
        -- Simplified MTBF calculation (in production, this would involve failure events)
        null::float as mtbf_hours,
        -- Simplified MTTR calculation (in production, this would involve repair events)
        null::float as mttr_minutes,
        -- Simplified data completeness calculation
        95.0 as data_completeness_percentage,
        -- Battery performance score (scale 0-100)
        case 
            when avg_battery_voltage >= 4.0 then 100
            when avg_battery_voltage >= 3.7 then 90
            when avg_battery_voltage >= 3.5 then 70
            when avg_battery_voltage >= 3.3 then 50
            when avg_battery_voltage >= 3.0 then 30
            else 10
        end as battery_performance_score,
        -- Signal performance score (scale 0-100)
        case 
            when avg_signal_strength >= -70 then 100
            when avg_signal_strength >= -80 then 80
            when avg_signal_strength >= -90 then 60
            when avg_signal_strength >= -100 then 40
            else 20
        end as signal_performance_score
    from uptime_calculation
),

-- Calculate overall health score
health_score as (
    select
        device_key,
        date_key,
        uptime_percentage,
        downtime_minutes,
        mtbf_hours,
        mttr_minutes,
        data_completeness_percentage,
        battery_performance_score,
        signal_performance_score,
        -- Overall health score is a weighted average of individual scores
        (
            (uptime_percentage * 0.4) +
            (battery_performance_score * 0.3) +
            (signal_performance_score * 0.2) +
            (data_completeness_percentage * 0.1)
        )::int as overall_health_score,
        current_timestamp as created_at
    from performance_scores
)

select * from health_score
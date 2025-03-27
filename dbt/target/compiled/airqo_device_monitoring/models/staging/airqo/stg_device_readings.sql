with source as (
    select * from "airflow"."analytics"."device_readings"
),

renamed as (
    select
        reading_id,
        device_id,
        timestamp,
        temperature,
        humidity,
        pm2_5,
        pm10,
        validation_status,
        reading_quality,
        created_at,
        updated_at
    from source
)

select * from renamed
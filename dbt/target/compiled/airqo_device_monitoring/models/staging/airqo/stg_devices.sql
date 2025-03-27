with source as (
    select * from "airflow"."analytics"."devices"
),

renamed as (
    select
        device_id,
        device_name,
        model_number,
        manufacture_date,
        firmware_version,
        hardware_version,
        is_active,
        deployment_location,
        power_source_type,
        created_at,
        updated_at
    from source
)

select * from renamed
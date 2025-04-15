
  create view "airflow"."public_staging"."stg_current_state__dbt_tmp"
    
    
  as (
    with source as (
    select * from "airflow"."analytics"."current_state"
),

renamed as (
    select
        status_id,
        device_id,
        battery_voltage,
        signal_strength_dbm,
        internal_temperature,
        memory_usage,
        error_code,
        status_timestamp,
        created_at,
        updated_at
    from source
)

select * from renamed
  );
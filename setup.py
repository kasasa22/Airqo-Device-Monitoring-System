#!/usr/bin/env python3
"""
AirQo Data Pipeline Directory Structure Setup (Current Directory)
----------------------------------------------------------------
This script creates the directory structure for the AirQo Data Pipeline project
assuming you are already in the project folder.
"""

import os
import sys
from pathlib import Path

def create_directory(path):
    """Create directory if it doesn't exist."""
    try:
        os.makedirs(path, exist_ok=True)
        print(f"Created directory: {path}")
    except Exception as e:
        print(f"Error creating directory {path}: {e}")
        sys.exit(1)

def create_empty_file(path):
    """Create an empty file if it doesn't exist."""
    if not os.path.exists(path):
        try:
            with open(path, 'w') as f:
                pass
            print(f"Created file: {path}")
        except Exception as e:
            print(f"Error creating file {path}: {e}")
            sys.exit(1)
    else:
        print(f"File already exists: {path}")

def setup_airqo_pipeline():
    """Set up the AirQo Data Pipeline project structure in the current directory."""
    # Use current directory as the base
    base_dir = Path(".")
    
    # Check if we're already in a directory that looks like the project root
    if os.path.exists(".env.example") or os.path.exists("docker-compose.yml"):
        print("It appears you're already in the Airqo-Data-Pipeline directory.")
    else:
        print("Setting up directory structure in the current directory...")
    
    # Create root level files (if they don't exist)
    create_empty_file(base_dir / ".env.example")
    create_empty_file(base_dir / ".gitignore")
    create_empty_file(base_dir / "docker-compose.prod.yml")
    create_empty_file(base_dir / "docker-compose.yml")
    create_empty_file(base_dir / "README.md")
    
    # Create services directories
    
    # 1. Backend Service
    backend_dir = base_dir / "backend"
    create_directory(backend_dir)
    
    # FastAPI application
    api_dir = backend_dir / "api"
    create_directory(api_dir)
    create_directory(api_dir / "app")
    create_directory(api_dir / "app" / "models")
    create_directory(api_dir / "app" / "routes")
    create_directory(api_dir / "app" / "schemas")
    create_directory(api_dir / "app" / "utils")
    create_empty_file(api_dir / "app" / "__init__.py")
    create_empty_file(api_dir / "app" / "main.py")
    create_empty_file(api_dir / "Dockerfile")
    create_empty_file(api_dir / "requirements.txt")
    
    # Database layer
    db_dir = backend_dir / "database"
    create_directory(db_dir)
    create_directory(db_dir / "migrations")
    create_directory(db_dir / "scripts")
    create_empty_file(db_dir / "init.sql")
    
    # 2. Frontend Service
    frontend_dir = base_dir / "frontend"
    create_directory(frontend_dir)
    create_directory(frontend_dir / "public")
    create_directory(frontend_dir / "src")
    create_directory(frontend_dir / "src" / "components")
    create_directory(frontend_dir / "src" / "pages")
    create_directory(frontend_dir / "src" / "styles")
    create_directory(frontend_dir / "src" / "utils")
    create_empty_file(frontend_dir / "Dockerfile")
    create_empty_file(frontend_dir / "package.json")
    create_empty_file(frontend_dir / ".env.local")
    
    # 3. Data Pipeline Services
    
    # Airflow service
    airflow_dir = base_dir / "airflow"
    create_directory(airflow_dir)
    create_directory(airflow_dir / "dags")
    create_directory(airflow_dir / "plugins")
    create_directory(airflow_dir / "logs")
    create_directory(airflow_dir / "config")
    create_empty_file(airflow_dir / "Dockerfile")
    create_empty_file(airflow_dir / "requirements.txt")
    
    # DBT service
    dbt_dir = base_dir / "dbt"
    create_directory(dbt_dir)
    create_directory(dbt_dir / "models")
    create_directory(dbt_dir / "models" / "staging")
    create_directory(dbt_dir / "models" / "marts")
    create_directory(dbt_dir / "seeds")
    create_directory(dbt_dir / "macros")
    create_directory(dbt_dir / "tests")
    create_empty_file(dbt_dir / "dbt_project.yml")
    create_empty_file(dbt_dir / "profiles.yml")
    create_empty_file(dbt_dir / "Dockerfile")
    
    # 4. Data Storage Services
    
    # PostgreSQL
    postgres_dir = base_dir / "postgres"
    create_directory(postgres_dir)
    create_directory(postgres_dir / "init")
    create_directory(postgres_dir / "data")
    create_empty_file(postgres_dir / "init" / "01-schema.sql")
    create_empty_file(postgres_dir / "init" / "02-seed-data.sql")
    
    # BigQuery connection
    bigquery_dir = base_dir / "bigquery"
    create_directory(bigquery_dir)
    create_directory(bigquery_dir / "schemas")
    create_directory(bigquery_dir / "queries")
    create_empty_file(bigquery_dir / "connection.json")
    
    # 5. Data Collection Services
    
    # ThingSpeak integration
    thingspeak_dir = base_dir / "thingspeak"
    create_directory(thingspeak_dir)
    create_directory(thingspeak_dir / "scripts")
    create_empty_file(thingspeak_dir / "api_config.json")
    
    # Sensors configuration
    sensors_dir = base_dir / "sensors"
    create_directory(sensors_dir)
    create_directory(sensors_dir / "config")
    create_directory(sensors_dir / "firmware")
    create_empty_file(sensors_dir / "device_registry.json")
    
    # 6. Documentation
    docs_dir = base_dir / "docs"
    create_directory(docs_dir)
    create_directory(docs_dir / "architecture")
    create_directory(docs_dir / "api")
    create_directory(docs_dir / "deployment")
    create_empty_file(docs_dir / "architecture" / "system_overview.md")
    create_empty_file(docs_dir / "api" / "endpoints.md")
    create_empty_file(docs_dir / "deployment" / "setup_guide.md")
    
    print("\nDirectory structure created successfully!")
    print("The AirQo Data Pipeline project structure has been set up in the current directory.")
    print("\nThe structure is organized into separate service directories:")
    print("1. backend - FastAPI application and database layer")
    print("2. frontend - Next.js application")
    print("3. airflow - Data orchestration service")
    print("4. dbt - Data transformation service")
    print("5. postgres - Database service")
    print("6. bigquery - Data warehouse connection")
    print("7. thingspeak - ThingSpeak integration")
    print("8. sensors - Sensor configuration and management")
    print("9. docs - Project documentation")

if __name__ == "__main__":
    setup_airqo_pipeline()
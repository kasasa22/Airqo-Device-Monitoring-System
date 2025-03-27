#!/bin/bash

# This script initializes the DBT environment and seeds mock data

# Install any required packages
pip install dbt-postgres

# Test the database connection
dbt debug

# Seed mock data
dbt seed

# Run models
dbt run

echo "DBT environment initialized successfully!"
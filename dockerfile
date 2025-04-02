FROM apache/airflow:2.5.1

USER root
# Install system dependencies if needed
# RUN apt-get update && apt-get install -y --no-install-recommends some-package

# Switch to airflow user for pip installations
USER airflow
RUN pip install --user dbt-postgres==1.5.0

# Add the local bin directory to PATH to ensure dbt is available
ENV PATH="/home/airflow/.local/bin:${PATH}"

# Verify dbt installation
RUN dbt --version
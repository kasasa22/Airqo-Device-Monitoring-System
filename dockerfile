FROM apache/airflow:2.5.1

USER root
# Install system dependencies if needed

USER airflow
RUN pip install --user dbt-postgres==1.5.0

# Add the local bin directory to PATH
ENV PATH="/home/airflow/.local/bin:${PATH}"

# Verify dbt installation
RUN dbt --version

# Add a proper CMD that runs a valid Airflow command
CMD ["airflow", "webserver"]
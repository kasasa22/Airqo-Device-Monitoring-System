FROM apache/airflow:2.5.1

USER root
# Install system dependencies if needed

USER airflow
RUN pip install --user dbt-postgres==1.5.0

# Add the local bin directory to PATH
ENV PATH="/home/airflow/.local/bin:${PATH}"

# Verify dbt installation
RUN dbt --version

# Expose the webserver port for Render to detect
EXPOSE 8080

# Use the Airflow standalone command which handles DB init and starts a webserver
CMD ["airflow", "standalone"]
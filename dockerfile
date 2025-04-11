FROM apache/airflow:2.5.1

USER root
# Install system dependencies if needed

USER airflow
RUN pip install --user dbt-postgres==1.5.0

# Add the local bin directory to PATH
ENV PATH="/home/airflow/.local/bin:${PATH}"

# Verify dbt installation
RUN dbt --version

# Create an entrypoint script that will initialize the DB and start the webserver
USER root
RUN echo '#!/bin/bash \n\
airflow db init \n\
airflow users create \
  --username airflow \
  --firstname Airflow \
  --lastname User \
  --role Admin \
  --email airflow@example.com \
  --password airflow \n\
airflow webserver \
' > /entrypoint.sh \
&& chmod +x /entrypoint.sh

USER airflow
# Expose the webserver port for Render to detect
EXPOSE 8080

# Use the entrypoint script
CMD ["/entrypoint.sh"]
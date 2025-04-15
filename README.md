# AirQo Device Health Monitoring System
## Overview
A comprehensive system for monitoring and maintaining AirQo's network of air quality sensors across Africa. The system processes real-time telemetry data, analyzes device performance, and provides actionable insights for maintenance and calibration.

## Features
- Real-time device status monitoring and alerting
- Performance metrics calculation (MTBF, MTTR, uptime percentages)
- Maintenance scheduling and impact assessment
- Co-location testing analysis for calibration
- Historical trend analysis and reporting

## Architecture
The system is built on a three-layer containerized architecture:

### Data Sources Layer
- AirQo GSM Sensors: Transmit telemetry data via cellular networks
- ThingSpeak: Functions as initial data lake for raw device data

### Backend Infrastructure Layer
- dbt: Handles data transformation workflows
- PostgreSQL: Primary database for device health metrics
- FastAPI: Provides RESTful API endpoints

### Frontend Layer
- Next.js: Delivers interactive web interface for monitoring and analysis

## Getting Started

### Prerequisites
- Docker and Docker Compose
- GSM-enabled AirQo sensors
- ThingSpeak account and API credentials
- PostgreSQL 14 or higher

### Installation
1. Clone the repository:
```bash
git clone https://github.com/your-org/airqo-device-monitoring.git
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Start the services:
```bash
docker-compose up -d
```

4. Access the dashboard:
```
http://localhost:3000
```

## Documentation
- Full system documentation available in `/docs`
- API documentation available at `/api/docs` after deployment
- Database schema documentation in `/backend/database/README.md`

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Contact
- Project Lead: Kasasa Trevor
- Organization: AIBOS UG
- Email: kasasatrevo25@gmail.com
- Website: [https://blog-website-six-eta.vercel.app/](https://blog-website-six-eta.vercel.app/)

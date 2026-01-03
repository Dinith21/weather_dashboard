# Weather Dashboard

A full-stack weather monitoring application featuring a Raspberry Pi backend API and a modern web frontend.

## Project Structure

- **dashboard_api**: Python backend API for sensor data collection and logging
- **sensor-dashboard**: React frontend for visualizing weather data

## Features

- Real-time weather data from BME280 sensor
- REST API for sensor readings
- Interactive web dashboard
- Persistent data logging

## Getting Started

### Prerequisites

- Python 3.x (backend)
- Node.js (frontend)
- BME280 sensor

<!-- ### Installation

**Backend:**
```bash
cd dashboard_api
pip install -r requirements.txt
```

**Frontend:**
```bash
cd sensor-dashboard
npm install
npm run dev
``` -->

## Raspberry Pi Setup
### Install npm and dependencies
```bash
cd weather_dashboard/sensor-dashboard
npm install
```

### Hardware Setup
Connect BME280 sensor to Raspberry Pi as follows:
- **GND**: Ground (Pin 6)
- **3.3V**: 3V3 Power (Pin 1)
- **SDA**: GPIO 2 (SDA) 
- **SCL**: GPIO 3 (SCL)

### Running the Backend API
Create a systemd service to run the Flask app using gunicorn:
```ini /etc/systemd/system/dashboard-api.service
[Unit]
Description=Gunicorn instance to serve dashboard_api
After=network.target

[Service]
User=pi
Group=www-data
WorkingDirectory=/home/pi/weather_dashboard/dashboard_api
Environment="PATH=/home/pi/venv/bin"
ExecStart=/home/pi/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5001 dashboard_api:app

[Install]
WantedBy=multi-user.target
```

Enable the service:
```bash
sudo systemctl daemon-reload
sudo systemctl start dashboard-api
sudo systemctl enable dashboard-api
```

Create an nginx config to run API on /api:
```nginx /etc/nginx/sites-available/sensor-dashboard
server {
    listen 80;
    server_name _;

    location / {
        root /var/www/sensor-dashboard;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Running the Application
Pull changes from GitHub and run React app using `deploy.sh` script:
```bash
cd weather_dashboard
./deploy.sh
```

#!/bin/bash

echo "--- 1. Navigating to project folder ---"
cd /home/pi/weather_dashboard/

echo "--- 2. Pulling from GitHub ---"
git pull

echo "--- 3. Navigating to app folder ---"
cd /home/pi/weather_dashboard/sensor-dashboard

echo "--- 4. Building React App ---"
npm run build

echo "--- 5. Clearing old files ---"
sudo rm -rf /var/www/sensor-dashboard/*

echo "--- 6. Copying new build ---"
sudo cp -r dist/* /var/www/sensor-dashboard/

echo "--- 5. Restarting Nginx ---"
sudo systemctl reload nginx

echo "✅ Update Complete!"

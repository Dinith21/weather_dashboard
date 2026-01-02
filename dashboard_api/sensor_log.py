import sqlite3
import datetime
from time import sleep
from sensor_read import read_sensor

conn = sqlite3.connect("/home/pi/weather_dashboard/dashboard_api/sensor_data.db")
c = conn.cursor()

c.execute("""
CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    temperature REAL,
    pressure REAL,
    humidity REAL
)
""")

conn.commit()
conn.close()

def save_reading(temperature, pressure, humidity):
    conn = sqlite3.connect("sensor_data.db")
    c = conn.cursor()

    c.execute(
        "INSERT INTO readings (temperature, pressure, humidity) VALUES (?, ?, ?)",
        (temperature, pressure, humidity)
    )

    conn.commit()
    conn.close()

reading = read_sensor()
temperature = reading["temperature"]
pressure = reading["pressure"]
humidity = reading["humidity"]
save_reading(temperature, pressure, humidity)
print("Saved new reading at ", datetime.datetime.now())

#TODO: add a maximum number of updates stored

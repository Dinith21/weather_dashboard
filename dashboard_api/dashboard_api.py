import sqlite3
from flask import Flask, jsonify
from sensor_read import read_sensor

conn = sqlite3.connect("sensor_data.db")
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

app = Flask(__name__)

@app.route("/api/sensor")
def sensor():
    data = read_sensor()
    return jsonify(data)
    
@app.route("/api/data")
def get_data():
    conn = sqlite3.connect("sensor_data.db")
    c = conn.cursor()

    c.execute("""
        SELECT timestamp, temperature, pressure, humidity
        FROM readings
        ORDER BY timestamp DESC
        LIMIT 100
    """)

    rows = c.fetchall()
    conn.close()

    return jsonify([
        {"timestamp": r[0], "temperature": r[1], "pressure": r[2], "humidity": r[3]}
        for r in reversed(rows)
    ])

app.run(host="0.0.0.0", port=5000)

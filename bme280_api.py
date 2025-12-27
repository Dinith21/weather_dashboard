import bme280
import smbus2
from flask import Flask, jsonify

port = 1
address = 0x77
bus = smbus2.SMBus(port)

calibration_params = bme280.load_calibration_params(bus,address)

def read_sensor():
    bme280_data = bme280.sample(bus, address, calibration_params)
    temperature = bme280_data.temperature
    pressure = bme280_data.pressure
    humidity = bme280_data.humidity
    return {
        "temperature": temperature,
        "pressure": pressure,
        "humidity": humidity
    }

app = Flask(__name__)

@app.route("/api/sensor")
def sensor():
    data = read_sensor()
    return jsonify(data)

app.run(host="0.0.0.0", port=5000)

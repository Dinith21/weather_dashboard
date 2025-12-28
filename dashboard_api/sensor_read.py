import bme280
import smbus2

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

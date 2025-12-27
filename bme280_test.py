import bme280
import smbus2
from time import sleep

port = 1
address = 0x77
bus = smbus2.SMBus(port)

calibration_params = bme280.load_calibration_params(bus,address)

while True:
    try:
        bme280_data = bme280.sample(bus, address, calibration_params)
        temperature = bme280_data.temperature
        pressure = bme280_data.pressure
        humidity = bme280_data.humidity
        print("Temperature: {:.2f} °C".format(temperature))
        print("Pressure: {:.2f} hPa".format(pressure))
        print("Humidity: {:.2f} %".format(humidity))
        sleep(1)
    except KeyboardInterrupt:
        print('Program stopped')
        break
    except Exception as e:
        print('Unexpected error:', str(e))
        break


export const applyCalibration = (metricKey, value, calibration) => {
  if (value === undefined || value === null) return null;
  const calib = calibration?.[metricKey] || { scale: 1, offset: 0 };
  const scale = Number.isFinite(calib.scale) ? calib.scale : 1;
  const offset = Number.isFinite(calib.offset) ? calib.offset : 0;
  return (value * scale) + offset;
};

export const convertTemperature = (celsius, unit) => {
  if (celsius === undefined || celsius === null) return null;
  if (unit === '°C') return celsius;
  if (unit === '°F') return (celsius * 9 / 5) + 32;
  if (unit === 'K') return celsius + 273.15;
  return celsius;
};

export const convertPressure = (hpa, unit) => {
  if (hpa === undefined || hpa === null) return null;
  if (unit === 'hPa') return hpa;
  if (unit === 'Pa') return hpa * 100;
  return hpa;
};

export const getTemperatureDisplay = (rawCelsius, settings) => {
  const calibrated = applyCalibration('temperature', rawCelsius, settings.calibration);
  return convertTemperature(calibrated, settings.temperatureUnit);
};

export const getHumidityDisplay = (rawHumidity, settings) => {
  return applyCalibration('humidity', rawHumidity, settings.calibration);
};

export const getPressureDisplay = (rawHpa, settings) => {
  const calibrated = applyCalibration('pressure', rawHpa, settings.calibration);
  return convertPressure(calibrated, settings.pressureUnit);
};

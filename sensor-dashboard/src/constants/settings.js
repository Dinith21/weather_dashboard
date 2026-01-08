export const DEFAULT_SETTINGS = {
  temperatureUnit: '°C',
  pressureUnit: 'hPa',
  decimalPlaces: {
    temperature: 3,
    humidity: 3,
    pressure: 3
  },
  calibration: {
    temperature: { scale: 1, offset: 0 },
    humidity: { scale: 1, offset: 0 },
    pressure: { scale: 1, offset: 0 }
  }
};

export const DEFAULT_AXIS_SETTINGS = {
  temperature: { xMin: '', xMax: '', yMin: '', yMax: '' },
  humidity: { xMin: '', xMax: '', yMin: '', yMax: '' },
  pressure: { xMin: '', xMax: '', yMin: '', yMax: '' }
};

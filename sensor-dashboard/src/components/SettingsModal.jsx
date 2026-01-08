import { useState } from 'react';
import { DEFAULT_SETTINGS } from '../constants/settings.js';

function SettingsModal({ settings, onSave, onClose }) {
  const [tempSettings, setTempSettings] = useState(settings);

  const handleChange = (key, value) => {
    setTempSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDecimalChange = (metric, value) => {
    setTempSettings(prev => ({
      ...prev,
      decimalPlaces: {
        ...prev.decimalPlaces,
        [metric]: Math.max(0, Math.min(12, parseInt(value) || 0))
      }
    }));
  };

  const handleCalibrationChange = (metric, field, value) => {
    setTempSettings(prev => ({
      ...prev,
      calibration: {
        ...prev.calibration,
        [metric]: {
          ...prev.calibration?.[metric],
          [field]: Number.isFinite(parseFloat(value)) ? parseFloat(value) : (field === 'scale' ? 1 : 0)
        }
      }
    }));
  };

  const handleReset = () => {
    setTempSettings(DEFAULT_SETTINGS);
  };

  const renderCalibrationSection = (metric, label) => (
    <div className="setting-group">
      <label>{label}</label>
      <div className="axis-row">
        <div className="axis-field">
          <label htmlFor={`${metric}-scale`}>Scale</label>
          <input
            id={`${metric}-scale`}
            type="number"
            step="0.1"
            value={tempSettings.calibration?.[metric]?.scale ?? 1}
            onChange={(e) => handleCalibrationChange(metric, 'scale', e.target.value)}
          />
        </div>
        <div className="axis-field">
          <label htmlFor={`${metric}-offset`}>Offset</label>
          <input
            id={`${metric}-offset`}
            type="number"
            step="0.1"
            value={tempSettings.calibration?.[metric]?.offset ?? 0}
            onChange={(e) => handleCalibrationChange(metric, 'offset', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Units</h3>

            <div className="setting-group">
              <label>Temperature Unit</label>
              <div className="radio-group">
                {['°C', '°F', 'K'].map(unit => (
                  <label key={unit} className="radio-label">
                    <input
                      type="radio"
                      name="temperature"
                      value={unit}
                      checked={tempSettings.temperatureUnit === unit}
                      onChange={(e) => handleChange('temperatureUnit', e.target.value)}
                    />
                    <span>{unit}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Pressure Unit</label>
              <div className="radio-group">
                {['hPa', 'Pa'].map(unit => (
                  <label key={unit} className="radio-label">
                    <input
                      type="radio"
                      name="pressure"
                      value={unit}
                      checked={tempSettings.pressureUnit === unit}
                      onChange={(e) => handleChange('pressureUnit', e.target.value)}
                    />
                    <span>{unit}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Decimal Places</h3>

            <div className="setting-group">
              <label htmlFor="temp-decimals">Temperature</label>
              <input
                id="temp-decimals"
                type="number"
                min="0"
                max="12"
                value={tempSettings.decimalPlaces.temperature}
                onChange={(e) => handleDecimalChange('temperature', e.target.value)}
              />
            </div>

            <div className="setting-group">
              <label htmlFor="humidity-decimals">Humidity</label>
              <input
                id="humidity-decimals"
                type="number"
                min="0"
                max="12"
                value={tempSettings.decimalPlaces.humidity}
                onChange={(e) => handleDecimalChange('humidity', e.target.value)}
              />
            </div>

            <div className="setting-group">
              <label htmlFor="pressure-decimals">Pressure</label>
              <input
                id="pressure-decimals"
                type="number"
                min="0"
                max="12"
                value={tempSettings.decimalPlaces.pressure}
                onChange={(e) => handleDecimalChange('pressure', e.target.value)}
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>Calibration</h3>
            {renderCalibrationSection('temperature', 'Temperature')}
            {renderCalibrationSection('humidity', 'Humidity')}
            {renderCalibrationSection('pressure', 'Pressure')}
          </div>
        </div>

        <div className="settings-footer">
          <button className="btn-secondary" onClick={handleReset}>Reset to Default</button>
          <div className="btn-group">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={() => onSave(tempSettings)}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;

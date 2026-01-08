import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

const DEFAULT_SETTINGS = {
  temperatureUnit: '°C',
  pressureUnit: 'hPa',
  decimalPlaces: {
    temperature: 3,
    humidity: 3,
    pressure: 3
  }
};

const DEFAULT_AXIS_SETTINGS = {
  temperature: { xMin: '', xMax: '', yMin: '', yMax: '' },
  humidity: { xMin: '', xMax: '', yMin: '', yMax: '' },
  pressure: { xMin: '', xMax: '', yMin: '', yMax: '' }
};

export default function App() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [axisSettings, setAxisSettings] = useState(() => {
    const saved = localStorage.getItem('chartAxisSettings');
    return saved ? JSON.parse(saved) : DEFAULT_AXIS_SETTINGS;
  });
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('weatherSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const fetchCurrent = async () => {
    try {
      setError(null);
      const res = await fetch("/api/sensor");
      if (!res.ok) throw new Error("Failed to fetch /api/sensor");
      const data = await res.json();
      setCurrent(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/log");
      if (!res.ok) throw new Error("Failed to fetch /api/log");
      const data = await res.json();

      const parsed = Object.values(data).map((entry) => {
        // Parse UTC timestamp and convert to local time
        // API returns: "2025-12-29 21:00:02"
        const utcDate = new Date(entry.timestamp + 'Z'); // Add 'Z' to indicate UTC
        const timestampMs = utcDate.getTime();
        const localTime = utcDate.toLocaleString('en-AU', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        
        return {
          ...entry,
          time: localTime,
          timestamp: entry.timestamp, // Keep original for reference
          timestampMs,
        };
      });

      setHistory(parsed);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchCurrent(), fetchHistory()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrent();
    fetchHistory();

    const interval = setInterval(fetchCurrent, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatLastUpdate = (date) => {
    if (!date) return "Never";
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 5) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('weatherSettings', JSON.stringify(newSettings));
  };

  const updateAxisSettings = (chartKey, updates) => {
    setAxisSettings(prev => {
      const next = {
        ...prev,
        [chartKey]: {
          ...DEFAULT_AXIS_SETTINGS[chartKey],
          ...prev[chartKey],
          ...updates,
        },
      };

      localStorage.setItem('chartAxisSettings', JSON.stringify(next));
      return next;
    });
  };

  const convertTemperature = (celsius) => {
    if (celsius === undefined || celsius === null) return null;
    if (settings.temperatureUnit === '°C') return celsius;
    if (settings.temperatureUnit === '°F') return (celsius * 9/5) + 32;
    if (settings.temperatureUnit === 'K') return celsius + 273.15;
    return celsius;
  };

  const convertPressure = (hpa) => {
    if (hpa === undefined || hpa === null) return null;
    if (settings.pressureUnit === 'hPa') return hpa;
    if (settings.pressureUnit === 'Pa') return hpa * 100;
    return hpa;
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Weather Dashboard</h1>
        <div className="header-right">
          <div className="last-update">
            Last update: {formatLastUpdate(lastUpdate)}
          </div>
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            Settings
          </button>
          {/* <button 
            className={`refresh-btn ${loading ? 'loading' : ''}`}
            onClick={handleRefresh}
            disabled={loading}
          >
            <span className="refresh-icon">⟳</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button> */}
        </div>
      </div>

      {error && (
        <div className="error">
          ⚠️ {error}
        </div>
      )}

      {showSettings && (
        <SettingsModal settings={settings} onSave={(newSettings) => {
          saveSettings(newSettings);
          setShowSettings(false);
        }} onClose={() => setShowSettings(false)} />
      )}

      <div className="metrics">
        <MetricCard 
          title="Temperature" 
          value={convertTemperature(current?.temperature)} 
          unit={settings.temperatureUnit}
          decimalPlaces={settings.decimalPlaces.temperature}
        />
        <MetricCard 
          title="Humidity" 
          value={current?.humidity} 
          unit="%" 
          decimalPlaces={settings.decimalPlaces.humidity}
        />
        <MetricCard 
          title="Pressure" 
          value={convertPressure(current?.pressure)} 
          unit={settings.pressureUnit}
          decimalPlaces={settings.decimalPlaces.pressure}
        />
      </div>

      <div className="charts">
        <ChartCard 
          title="Temperature History" 
          data={history} 
          dataKey="temperature" 
          color="#ef4444" 
          unit={settings.temperatureUnit}
          convertValue={convertTemperature}
          decimalPlaces={settings.decimalPlaces.temperature}
          axisSettings={axisSettings.temperature}
          onUpdateAxisSettings={(updates) => updateAxisSettings('temperature', updates)}
        />
        <ChartCard 
          title="Humidity History" 
          data={history} 
          dataKey="humidity" 
          color="#3b82f6" 
          unit="%" 
          decimalPlaces={settings.decimalPlaces.humidity}
          axisSettings={axisSettings.humidity}
          onUpdateAxisSettings={(updates) => updateAxisSettings('humidity', updates)}
        />
        <ChartCard 
          title="Pressure History" 
          data={history} 
          dataKey="pressure" 
          color="#10b981" 
          unit={settings.pressureUnit}
          convertValue={convertPressure}
          decimalPlaces={settings.decimalPlaces.pressure}
          axisSettings={axisSettings.pressure}
          onUpdateAxisSettings={(updates) => updateAxisSettings('pressure', updates)}
        />
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, decimalPlaces }) {
  return (
    <div className="metric-card">
      <p className="metric-title">{title}</p>
      {value !== undefined && value !== null ? (
        <p className="metric-value">
          {typeof value === 'number' ? value.toFixed(decimalPlaces || 2) : value} <span>{unit}</span>
        </p>
      ) : (
        <div className="loading-skeleton" />
      )}
    </div>
  );
}

function ChartCard({ title, data, dataKey, color, unit, convertValue, decimalPlaces, axisSettings, onUpdateAxisSettings }) {
  const displayData = convertValue ? data.map(item => ({
    ...item,
    [dataKey]: convertValue(item[dataKey])
  })) : data;


  const safeAxisSettings = axisSettings || { xMin: '', xMax: '', yMin: '', yMax: '' };
  const [showAxisSettings, setShowAxisSettings] = useState(false);

  const parseDateInput = (value) => {
    if (!value) return undefined;
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : undefined;
  };

  const parseNumberInput = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  };

  const xMinMs = parseDateInput(safeAxisSettings.xMin);
  const xMaxMs = parseDateInput(safeAxisSettings.xMax);
  const yMinValue = parseNumberInput(safeAxisSettings.yMin);
  const yMaxValue = parseNumberInput(safeAxisSettings.yMax);

  const timestamps = displayData
    .map(item => item.timestampMs)
    .filter(ts => Number.isFinite(ts));

  const autoXDomain = timestamps.length
    ? [Math.min(...timestamps), Math.max(...timestamps)]
    : ['auto', 'auto'];

  const xDomainFromSettings = [xMinMs ?? 'auto', xMaxMs ?? 'auto'];
  const resolvedXDomain = (xMinMs !== undefined || xMaxMs !== undefined)
    ? xDomainFromSettings
    : autoXDomain;

  const yValues = displayData
    .map(item => item[dataKey])
    .filter(v => Number.isFinite(v));

  // Round automatic Y bounds to whole numbers so the axis ticks look cleaner
  const roundDomainToWhole = (domain) => {
    const [min, max] = domain;
    const hasMin = Number.isFinite(min);
    const hasMax = Number.isFinite(max);
    if (!hasMin || !hasMax) return domain;

    if (min === max) {
      const value = Math.round(min);
      return [value - 1, value + 1];
    }

    return [Math.floor(min), Math.ceil(max)];
  };

  const autoYDomain = yValues.length
    ? [Math.min(...yValues), Math.max(...yValues)]
    : ['auto', 'auto'];

  const baseYDomain = roundDomainToWhole(autoYDomain);
  const resolvedYDomain = [
    yMinValue !== undefined ? yMinValue : baseYDomain[0] ?? 'auto',
    yMaxValue !== undefined ? yMaxValue : baseYDomain[1] ?? 'auto',
  ];

  const timeFormatter = (value) => {
    if (!Number.isFinite(value)) return '';
    return new Date(value).toLocaleString('en-AU', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleAxisChange = (key, value) => {
    onUpdateAxisSettings({ [key]: value });
  };

  const handleReset = () => {
    onUpdateAxisSettings({ xMin: '', xMax: '', yMin: '', yMax: '' });
  };

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h2>{title}</h2>
        <button
          className="axis-settings-btn"
          onClick={() => setShowAxisSettings(prev => !prev)}
          aria-expanded={showAxisSettings}
        >
          Axis Settings
        </button>
      </div>

      {showAxisSettings && (
        <div className="axis-settings">
          <div className="axis-row">
            <div className="axis-field">
              <label htmlFor={`${dataKey}-xmin`}>X min</label>
              <input
                id={`${dataKey}-xmin`}
                type="datetime-local"
                value={safeAxisSettings.xMin || ''}
                onChange={(e) => handleAxisChange('xMin', e.target.value)}
              />
            </div>
            <div className="axis-field">
              <label htmlFor={`${dataKey}-xmax`}>X max</label>
              <input
                id={`${dataKey}-xmax`}
                type="datetime-local"
                value={safeAxisSettings.xMax || ''}
                onChange={(e) => handleAxisChange('xMax', e.target.value)}
              />
            </div>
          </div>
          <div className="axis-row">
            <div className="axis-field">
              <label htmlFor={`${dataKey}-ymin`}>Y min</label>
              <input
                id={`${dataKey}-ymin`}
                type="number"
                value={safeAxisSettings.yMin ?? ''}
                onChange={(e) => handleAxisChange('yMin', e.target.value)}
                placeholder={baseYDomain[0] ?? 'auto'}
              />
            </div>
            <div className="axis-field">
              <label htmlFor={`${dataKey}-ymax`}>Y max</label>
              <input
                id={`${dataKey}-ymax`}
                type="number"
                value={safeAxisSettings.yMax ?? ''}
                onChange={(e) => handleAxisChange('yMax', e.target.value)}
                placeholder={baseYDomain[1] ?? 'auto'}
              />
            </div>
          </div>
          <div className="axis-actions">
            <button className="btn-secondary" onClick={handleReset}>Reset to auto</button>
          </div>
        </div>
      )}

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <XAxis 
              dataKey="timestampMs"
              type="number"
              domain={resolvedXDomain}
              tickFormatter={timeFormatter}
              stroke="#64748b"
              style={{ fontSize: '11px' }}
              allowDataOverflow
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '11px' }}
              domain={resolvedYDomain}
              allowDataOverflow
            />
            <Tooltip 
              wrapperStyle={{ zIndex: 1000 }}
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                color: '#f1f5f9'
              }}
              formatter={(value) => [`${value.toFixed(decimalPlaces || 1)} ${unit}`, title.replace(' History', '')]}
              labelFormatter={timeFormatter}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

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

  const handleReset = () => {
    setTempSettings(DEFAULT_SETTINGS);
  };

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

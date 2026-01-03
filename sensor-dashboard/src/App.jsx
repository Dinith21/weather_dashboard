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

export default function App() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
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
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('weatherSettings', JSON.stringify(newSettings));
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
    if (settings.pressureUnit === 'atm') return hpa / 1013.25;
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
          unit={`°${settings.temperatureUnit}`}
          convertValue={convertTemperature}
          decimalPlaces={settings.decimalPlaces.temperature}
        />
        <ChartCard 
          title="Humidity History" 
          data={history} 
          dataKey="humidity" 
          color="#3b82f6" 
          unit="%" 
          decimalPlaces={settings.decimalPlaces.humidity}
        />
        <ChartCard 
          title="Pressure History" 
          data={history} 
          dataKey="pressure" 
          color="#10b981" 
          unit={settings.pressureUnit}
          convertValue={convertPressure}
          decimalPlaces={settings.decimalPlaces.pressure}
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

function ChartCard({ title, data, dataKey, color, unit, convertValue, decimalPlaces }) {
  const displayData = convertValue ? data.map(item => ({
    ...item,
    [dataKey]: convertValue(item[dataKey])
  })) : data;

  return (
    <div className="chart-card">
      <h2>{title}</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData}>
            <XAxis 
              dataKey="time" 
              stroke="#64748b"
              style={{ fontSize: '11px' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '11px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                color: '#f1f5f9'
              }}
              formatter={(value) => [`${value.toFixed(decimalPlaces || 1)} ${unit}`, title.replace(' History', '')]}
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
        [metric]: Math.max(0, Math.min(5, parseInt(value) || 0))
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
                {['C', 'F', 'K'].map(unit => (
                  <label key={unit} className="radio-label">
                    <input
                      type="radio"
                      name="temperature"
                      value={unit}
                      checked={tempSettings.temperatureUnit === unit}
                      onChange={(e) => handleChange('temperatureUnit', e.target.value)}
                    />
                    <span>°{unit}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Pressure Unit</label>
              <div className="radio-group">
                {['hPa', 'Pa', 'atm'].map(unit => (
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
                max="5"
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
                max="5"
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
                max="5"
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

import { useEffect, useState } from "react";
import "./App.css";
import { DEFAULT_SETTINGS, DEFAULT_AXIS_SETTINGS } from "./constants/settings.js";
import { fetchCurrent as fetchCurrentAPI, fetchHistory as fetchHistoryAPI } from "./utils/api.js";
import {
  getTemperatureDisplay,
  getHumidityDisplay,
  getPressureDisplay,
} from "./utils/conversions.js";
import { formatLastUpdate } from "./utils/formatting.js";
import MetricCard from "./components/MetricCard.jsx";
import ChartCard from "./components/ChartCard.jsx";
import SettingsModal from "./components/SettingsModal.jsx";

export default function App() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [axisSettings, setAxisSettings] = useState(() => {
    const saved = localStorage.getItem('chartAxisSettings');
    return saved ? JSON.parse(saved) : DEFAULT_AXIS_SETTINGS;
  });
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('weatherSettings');
    const base = saved ? JSON.parse(saved) : {};
    return {
      ...DEFAULT_SETTINGS,
      ...base,
      decimalPlaces: {
        ...DEFAULT_SETTINGS.decimalPlaces,
        ...(base.decimalPlaces || {})
      },
      calibration: {
        ...DEFAULT_SETTINGS.calibration,
        ...(base.calibration || {})
      }
    };
  });

  const fetchCurrent = async () => {
    try {
      setError(null);
      const data = await fetchCurrentAPI();
      setCurrent(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchHistory = async () => {
    try {
      const parsed = await fetchHistoryAPI();
      setHistory(parsed);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchCurrent();
    fetchHistory();

    const interval = setInterval(fetchCurrent, 5000);
    return () => clearInterval(interval);
  }, []);

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
          value={getTemperatureDisplay(current?.temperature, settings)} 
          unit={settings.temperatureUnit}
          decimalPlaces={settings.decimalPlaces.temperature}
        />
        <MetricCard 
          title="Humidity" 
          value={getHumidityDisplay(current?.humidity, settings)} 
          unit="%" 
          decimalPlaces={settings.decimalPlaces.humidity}
        />
        <MetricCard 
          title="Pressure" 
          value={getPressureDisplay(current?.pressure, settings)} 
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
          convertValue={(val) => getTemperatureDisplay(val, settings)}
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
          convertValue={(val) => getHumidityDisplay(val, settings)}
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
          convertValue={(val) => getPressureDisplay(val, settings)}
          decimalPlaces={settings.decimalPlaces.pressure}
          axisSettings={axisSettings.pressure}
          onUpdateAxisSettings={(updates) => updateAxisSettings('pressure', updates)}
        />
      </div>
    </div>
  );
}

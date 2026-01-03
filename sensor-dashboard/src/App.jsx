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

export default function App() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

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

  return (
    <div className="app">
      <div className="header">
        <h1>Weather Dashboard</h1>
        <div className="header-right">
          <div className="last-update">
            Last update: {formatLastUpdate(lastUpdate)}
          </div>
          <button 
            className={`refresh-btn ${loading ? 'loading' : ''}`}
            onClick={handleRefresh}
            disabled={loading}
          >
            <span className="refresh-icon">⟳</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error">
          ⚠️ {error}
        </div>
      )}

      <div className="metrics">
        <MetricCard title="Temperature" value={current?.temperature} unit="°C" />
        <MetricCard title="Humidity" value={current?.humidity} unit="%" />
        <MetricCard title="Pressure" value={current?.pressure} unit="hPa" />
      </div>

      <div className="charts">
        <ChartCard title="Temperature History" data={history} dataKey="temperature" color="#ef4444" unit="°C" />
        <ChartCard title="Humidity History" data={history} dataKey="humidity" color="#3b82f6" unit="%" />
        <ChartCard title="Pressure History" data={history} dataKey="pressure" color="#10b981" unit="hPa" />
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit }) {
  return (
    <div className="metric-card">
      <p className="metric-title">{title}</p>
      {value !== undefined && value !== null ? (
        <p className="metric-value">
          {typeof value === 'number' ? value.toFixed(3) : value} <span>{unit}</span>
        </p>
      ) : (
        <div className="loading-skeleton" />
      )}
    </div>
  );
}

function ChartCard({ title, data, dataKey, color, unit }) {
  return (
    <div className="chart-card">
      <h2>{title}</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
              formatter={(value) => [`${value.toFixed(1)} ${unit}`, title.replace(' History', '')]}
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

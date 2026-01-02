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

  const fetchCurrent = async () => {
    try {
      const res = await fetch("/api/sensor");
      if (!res.ok) throw new Error("Failed to fetch /api/sensor");
      const data = await res.json();
      setCurrent(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/log");
      if (!res.ok) throw new Error("Failed to fetch /api/log");
      const data = await res.json();

      const parsed = Object.values(data).map((entry) => ({
        ...entry,
        time: new Date(entry.timestamp).toLocaleTimeString(),
      }));

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

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="app">
      <h1>Sensor Dashboard</h1>

      <div className="metrics">
        <MetricCard title="Temperature" value={current?.temperature} unit="°C" />
        <MetricCard title="Humidity" value={current?.humidity} unit="%" />
        <MetricCard title="Pressure" value={current?.pressure} unit="hPa" />
      </div>

      <div className="chart-card">
        <h2>History</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="humidity" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="pressure" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit }) {
  return (
    <div className="metric-card">
      <p className="metric-title">{title}</p>
      <p className="metric-value">
        {value ?? "--"} <span>{unit}</span>
      </p>
    </div>
  );
}

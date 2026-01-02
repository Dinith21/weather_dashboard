import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function App() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  // Fetch current sensor values
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

  // Fetch historical log
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/log/");
      if (!res.ok) throw new Error("Failed to fetch /api/log/");
      const data = await res.json();

      // Convert indexed object -> array
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
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-6">Sensor Dashboard</h1>

      {/* Current readings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard title="Temperature" value={current?.temperature} unit="°C" />
        <MetricCard title="Humidity" value={current?.humidity} unit="%" />
        <MetricCard title="Pressure" value={current?.pressure} unit="hPa" />
      </div>

      {/* History chart */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4">
          <h2 className="text-lg font-medium mb-4">History</h2>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" />
                <Line type="monotone" dataKey="humidity" />
                <Line type="monotone" dataKey="pressure" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, unit }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-6">
        <p className="text-sm text-gray-500 mb-2">{title}</p>
        <p className="text-3xl font-semibold">
          {value ?? "--"} <span className="text-base font-normal">{unit}</span>
        </p>
      </CardContent>
    </Card>
  );
}

export const fetchCurrent = async () => {
  const res = await fetch("/api/sensor");
  if (!res.ok) throw new Error("Failed to fetch /api/sensor");
  return res.json();
};

export const fetchHistory = async () => {
  const res = await fetch("/api/log");
  if (!res.ok) throw new Error("Failed to fetch /api/log");
  const data = await res.json();

  const parsed = Object.values(data).map((entry) => {
    const utcDate = new Date(entry.timestamp + 'Z');
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
      timestamp: entry.timestamp,
      timestampMs,
    };
  });

  return parsed;
};

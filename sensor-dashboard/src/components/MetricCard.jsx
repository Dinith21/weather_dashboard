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

export default MetricCard;

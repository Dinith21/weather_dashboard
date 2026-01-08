import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  parseDateInput,
  parseNumberInput,
  roundDomainToWhole,
  timeFormatter,
} from '../utils/formatting.js';

function ChartCard({ title, data, dataKey, color, unit, convertValue, decimalPlaces, axisSettings, onUpdateAxisSettings }) {
  const displayData = convertValue ? data.map(item => ({
    ...item,
    [dataKey]: convertValue(item[dataKey])
  })) : data;

  const safeAxisSettings = axisSettings || { xMin: '', xMax: '', yMin: '', yMax: '' };
  const [showAxisSettings, setShowAxisSettings] = useState(false);

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

  const autoYDomain = yValues.length
    ? [Math.min(...yValues), Math.max(...yValues)]
    : ['auto', 'auto'];

  const baseYDomain = roundDomainToWhole(autoYDomain);
  const resolvedYDomain = [
    yMinValue !== undefined ? yMinValue : baseYDomain[0] ?? 'auto',
    yMaxValue !== undefined ? yMaxValue : baseYDomain[1] ?? 'auto',
  ];

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

export default ChartCard;

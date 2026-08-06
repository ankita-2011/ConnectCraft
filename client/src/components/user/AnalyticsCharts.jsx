import React from 'react';
import '../../styles/user/analytics.css';

/**
 * Pure SVG Bar Chart
 */
export const BarChart = ({ data = [], height = 180 }) => {
  if (!data || data.length === 0) {
    return <div style={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No trend data recorded for timeframe</div>;
  }

  const maxVal = Math.max(...data.map((d) => d.value || 0), 1);
  const svgWidth = 400;
  const padding = 30;
  const chartWidth = svgWidth - padding * 2;
  const barWidth = Math.max(12, Math.floor(chartWidth / data.length) - 10);

  return (
    <div className="svg-chart-wrapper" style={{ height }}>
      <svg viewBox={`0 0 ${svgWidth} ${height}`} style={{ width: '100%', height: '100%' }}>
        {/* Baseline */}
        <line x1={padding} y1={height - padding} x2={svgWidth - padding} y2={height - padding} stroke="var(--border-color)" strokeWidth="1" />

        {data.map((item, idx) => {
          const val = item.value || 0;
          const barHeight = Math.round(((height - padding * 2) * val) / maxVal);
          const x = padding + idx * (chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2;
          const y = height - padding - barHeight;

          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx="4"
                fill="var(--color-primary)"
                opacity="0.85"
              />
              <text
                x={x + barWidth / 2}
                y={height - 10}
                fill="var(--text-secondary)"
                fontSize="10"
                textAnchor="middle"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Pure SVG Line / Area Chart
 */
export const LineChart = ({ data = [], height = 180 }) => {
  if (!data || data.length === 0) {
    return <div style={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No trajectory data available</div>;
  }

  const maxVal = Math.max(...data.map((d) => d.value || 0), 1);
  const svgWidth = 400;
  const padding = 30;

  const points = data.map((item, idx) => {
    const x = padding + (idx * (svgWidth - padding * 2)) / (data.length - 1 || 1);
    const y = height - padding - (((height - padding * 2) * (item.value || 0)) / maxVal);
    return { x, y, label: item.label, value: item.value };
  });

  const pathD = points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  return (
    <div className="svg-chart-wrapper" style={{ height }}>
      <svg viewBox={`0 0 ${svgWidth} ${height}`} style={{ width: '100%', height: '100%' }}>
        <path d={pathD} fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" />
        {points.map((pt, idx) => (
          <circle key={idx} cx={pt.x} cy={pt.y} r="4" fill="var(--color-accent)" stroke="var(--bg-primary)" strokeWidth="2" />
        ))}
      </svg>
    </div>
  );
};

/**
 * Pure SVG Donut Chart for Distribution Breakdown
 */
export const DonutChart = ({ data = [], size = 160 }) => {
  if (!data || data.length === 0) {
    return <div style={{ height: size, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No category data</div>;
  }

  const total = data.reduce((acc, d) => acc + (d.value || 0), 0) || 1;
  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

  let cumulativeAngle = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {data.map((item, idx) => {
          const val = item.value || 0;
          const percentage = val / total;
          const strokeDasharray = `${percentage * 283} 283`;
          const strokeDashoffset = -cumulativeAngle * 283;
          cumulativeAngle += percentage;

          return (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={colors[idx % colors.length]}
              strokeWidth="10"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
            />
          );
        })}
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors[idx % colors.length] }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>{item.label}: <strong>{item.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
};

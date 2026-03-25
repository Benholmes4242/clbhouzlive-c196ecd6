import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminDonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  innerRadius?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

export function AdminDonutChart({
  data,
  size = 160,
  innerRadius = 48,
  centerLabel,
  centerValue,
}: AdminDonutChartProps) {
  const outerRadius = size / 2 - 8;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            strokeWidth={2}
            stroke="#FFFFFF"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, name: string) => [v.toLocaleString(), name]}
            contentStyle={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue !== undefined) && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {centerValue !== undefined && (
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

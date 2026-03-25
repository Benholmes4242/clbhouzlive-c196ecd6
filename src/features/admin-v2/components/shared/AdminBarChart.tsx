import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

interface AdminBarChartProps {
  data: { label: string; value: number; color?: string }[];
  color?: string;
  height?: number;
  horizontal?: boolean;
  showValues?: boolean;
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '8px 12px' }}>
      <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{payload[0].value?.toLocaleString()}</p>
    </div>
  );
};

export function AdminBarChart({
  data,
  color = '#F5A623',
  height = 200,
  horizontal = false,
  showValues = false,
}: AdminBarChartProps) {
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={Math.max(height, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: showValues ? 40 : 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} width={120} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} width={32} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color ?? color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

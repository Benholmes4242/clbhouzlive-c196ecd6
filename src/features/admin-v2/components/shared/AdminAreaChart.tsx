import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Shared tooltip ───────────────────────────────────────────────────────────

export const AdminChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '8px 12px' }}>
      <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2" style={{ fontSize: 12 }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: '#64748B' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Standard axis props ──────────────────────────────────────────────────────

export const xAxisProps = {
  tick: { fontSize: 11, fill: '#94A3B8' },
  axisLine: false,
  tickLine: false,
  interval: 'preserveStartEnd' as const,
};

export const yAxisProps = {
  tick: { fontSize: 11, fill: '#94A3B8' },
  axisLine: false,
  tickLine: false,
  allowDecimals: false,
  width: 36,
};

export const gridProps = {
  strokeDasharray: '3 3',
  stroke: '#F1F5F9',
  vertical: false,
};

// ─── Chart skeleton ───────────────────────────────────────────────────────────

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="w-full rounded-lg animate-pulse" style={{ height, background: '#F1F5F9' }} />
  );
}

// ─── Single area chart ────────────────────────────────────────────────────────

interface SingleAreaChartProps {
  data: { date: string; value: number }[];
  color?: string;
  height?: number;
  name?: string;
}

export function SingleAreaChart({
  data,
  color = '#F5A623',
  height = 180,
  name = 'Value',
}: SingleAreaChartProps) {
  const gradId = `grad-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" {...xAxisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<AdminChartTooltip />} />
        <Area type="monotone" dataKey="value" name={name} stroke={color} fill={`url(#${gradId})`} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Dual area chart ──────────────────────────────────────────────────────────

interface SeriesConfig {
  key:   string;
  name:  string;
  color: string;
}

interface DualAreaChartProps {
  data:   Record<string, any>[];
  series: SeriesConfig[];
  height?: number;
}

export function DualAreaChart({ data, series, height = 200 }: DualAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" {...xAxisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<AdminChartTooltip />} />
        <Legend />
        {series.map(s => (
          <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} fill={`url(#grad-${s.key})`} strokeWidth={2} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Stacked bar chart ────────────────────────────────────────────────────────

interface StackedBarChartProps {
  data:   Record<string, any>[];
  series: SeriesConfig[];
  height?: number;
}

export function StackedBarChart({ data, series, height = 200 }: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" {...xAxisProps} />
        <YAxis {...yAxisProps} />
        <Tooltip content={<AdminChartTooltip />} />
        <Legend />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} stackId="a" radius={i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Shared tooltip ───────────────────────────────────────────────────────────

export const AdminChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-[12px]">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Standard axis props ──────────────────────────────────────────────────────

export const xAxisProps = {
  tick: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
  axisLine: false,
  tickLine: false,
  interval: 'preserveStartEnd' as const,
};

export const yAxisProps = {
  tick: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
  axisLine: false,
  tickLine: false,
  allowDecimals: false,
  width: 36,
};

export const gridProps = {
  strokeDasharray: '3 3',
  stroke: 'hsl(var(--border) / 0.4)',
  vertical: false,
};

// ─── Chart skeleton ───────────────────────────────────────────────────────────

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="w-full rounded-lg bg-muted/30 animate-pulse" style={{ height }} />
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
  color = 'hsl(var(--accent-amber))',
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

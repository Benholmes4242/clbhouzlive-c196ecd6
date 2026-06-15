import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { adminTheme as t } from '../theme';

export interface KpiTrendPoint {
  date: string;
  value: number;
}

interface Props {
  label: string;
  value: number | string;
  delta?: number;
  trend?: KpiTrendPoint[];
  loading?: boolean;
}

export default function KpiCard({ label, value, delta, trend, loading }: Props) {
  const positive = (delta ?? 0) >= 0;
  const deltaColor = positive ? t.ok : t.danger;

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: t.radius.lg,
        boxShadow: t.shadowCard,
        padding: 16,
        minHeight: 96,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          color: t.inkFaint,
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ color: t.ink, fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>
          {loading ? '—' : value}
        </div>
        {typeof delta === 'number' && !loading && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              color: deltaColor,
              background: positive ? '#DCFCE7' : '#FEE2E2',
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>

      {trend && trend.length > 0 && (
        <div style={{ height: 36, marginLeft: -4, marginRight: -4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`kpi-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.brand} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={t.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={t.brand}
                strokeWidth={1.5}
                fill={`url(#kpi-${label})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

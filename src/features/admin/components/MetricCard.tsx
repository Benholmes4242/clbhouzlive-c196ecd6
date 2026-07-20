import React from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { adminTheme as t } from '../theme';

interface MetricCardProps {
  label: string;
  value: number | null;
  delta?: number;
  deltaLabel?: string;
  sparkline?: number[];
  to: string;
  loading?: boolean;
}

const num = (n: number) => n.toLocaleString();

export default function MetricCard({
  label, value, delta, deltaLabel, sparkline, to, loading,
}: MetricCardProps) {
  const positive = (delta ?? 0) >= 0;
  const sparkData = (sparkline ?? []).map((v, i) => ({ i, v }));

  return (
    <Link
      to={to}
      style={{
        background: t.surface,
        border: `1px solid ${t.line}`,
        borderRadius: 18,
        boxShadow: t.shadowCard,
        padding: '12px 12px 0',
        display: 'flex', flexDirection: 'column', gap: 4,
        minWidth: 0,
        textDecoration: 'none', color: 'inherit',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={{
        color: t.inkFaint, fontSize: 11, fontWeight: 700,
        letterSpacing: 0.5, textTransform: 'uppercase',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      <div style={{
        color: t.ink, fontSize: 24, fontWeight: 800, lineHeight: 1.05,
        fontFeatureSettings: '"tnum" 1, "kern" 1, "liga" 1',
        fontVariantNumeric: 'tabular-nums',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {loading || value === null ? '-' : num(value)}
      </div>
      {typeof delta === 'number' && !loading ? (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 2,
          color: positive ? t.okText : t.dangerText,
          fontSize: 11, fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {Math.abs(delta)}%
          {deltaLabel && <span style={{ color: t.inkFaint, fontWeight: 500, marginLeft: 4 }}>{deltaLabel}</span>}
        </div>
      ) : deltaLabel ? (
        <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 500 }}>{deltaLabel}</div>
      ) : (
        <div style={{ height: 14 }} />
      )}
      <div style={{ height: 28, marginTop: 6, marginLeft: -12, marginRight: -12 }}>
        {sparkData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.brand} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={t.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={t.brand} strokeWidth={1.5}
                fill={`url(#spark-${label})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </Link>
  );
}

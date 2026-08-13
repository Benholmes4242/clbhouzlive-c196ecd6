import React, { useId } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { adminTheme as t } from '../theme';

interface MetricCardProps {
  label: string;
  value: number | null;
  /**
   * Rounded percentage change. `null` means "no comparable previous period"
   * (previous was 0) and renders the word "New", never 100%.
   */
  delta?: number | null;
  deltaLabel?: string;
  sparkline?: number[];
  to: string;
  loading?: boolean;
}

const num = (n: number) => n.toLocaleString();

/** up / down / level — an arrow is a claim of direction and zero has none. */
type DeltaState = 'up' | 'down' | 'level';
function deltaState(rounded: number): DeltaState {
  if (rounded > 0) return 'up';
  if (rounded < 0) return 'down';
  return 'level';
}

export default function MetricCard({
  label, value, delta, deltaLabel, sparkline, to, loading,
}: MetricCardProps) {
  // Slug the gradient id: `url(#spark-Sessions 7d)` is not a valid functional
  // IRI, the reference fails and the fill falls back to black. useId keeps it
  // unique per rendered card even if two cards share a label.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gid = `spark-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uid}`;

  const sparkData = (sparkline ?? []).map((v, i) => ({ i, v }));
  // Round FIRST, to an INTEGER, then branch — deciding direction before
  // rounding renders "-0.0%" for a value fractionally below zero, and a
  // one-decimal round mixes "233.3%" with "80%" in one grid.
  const rounded = typeof delta === 'number' ? Math.round(delta) : null;
  const state = rounded === null ? null : deltaState(rounded);
  const showNew = delta === null && !loading && value !== null && value > 0;

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
        color: t.ink, fontSize: 24, fontWeight: 700, lineHeight: 1.05,
        letterSpacing: '-0.03em',
        fontFeatureSettings: '"tnum" 1, "kern" 1, "liga" 1',
        fontVariantNumeric: 'tabular-nums',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {loading || value === null ? '-' : num(value)}
      </div>
      {state && !loading ? (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 2,
          color: state === 'up' ? t.okText : state === 'down' ? t.dangerText : t.inkMuted,
          fontSize: 11, fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {state === 'up' && <ArrowUpRight size={11} />}
          {state === 'down' && <ArrowDownRight size={11} />}
          {state === 'level' ? 'Level' : `${Math.abs(rounded!)}%`}
          {deltaLabel && <span style={{ color: t.inkFaint, fontWeight: 500, marginLeft: 4 }}>{deltaLabel}</span>}
        </div>
      ) : showNew ? (
        <div style={{ color: t.brandText, fontSize: 11, fontWeight: 700 }}>
          New
          {deltaLabel && <span style={{ color: t.inkFaint, fontWeight: 500, marginLeft: 4 }}>{deltaLabel}</span>}
        </div>
      ) : deltaLabel ? (
        <div style={{ color: t.inkFaint, fontSize: 11, fontWeight: 500 }}>{deltaLabel}</div>
      ) : null}
      {sparkData.length > 1 ? (
        <div style={{ height: 28, marginTop: 6, marginLeft: -12, marginRight: -12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.brand} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={t.brand} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={t.brand} strokeWidth={1.5}
                fill={`url(#${gid})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </Link>
  );
}

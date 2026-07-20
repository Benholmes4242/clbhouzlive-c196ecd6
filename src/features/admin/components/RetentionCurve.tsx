import React, { useMemo } from 'react';
import { adminTheme as t } from '../theme';
import EmptyState from './EmptyState';
import type { RetentionCohort } from '../hooks/useAnalytics';

interface Props {
  cohorts: RetentionCohort[];
}

/**
 * Retention curve. X = weeks since joining. Lines:
 *   - Up to 4 most-recent cohorts, thinnest lines at stepped opacity.
 *   - Bold ink line = weighted average (by cohort size) across those cohorts,
 *     plotted only where at least 2 cohorts have data at that offset.
 * Data comes exclusively from RetentionCohort.retention (fetchRetention);
 * no new queries. Null offsets are NOT interpolated - lines simply stop.
 */
export default function RetentionCurve({ cohorts }: Props) {
  const recent = useMemo(() => cohorts.slice(0, 4), [cohorts]);
  const w1Coverage = recent.filter(c => c.retention[1] !== null).length;

  const maxOffset = useMemo(() => {
    let m = 0;
    for (const c of recent) {
      for (let i = c.retention.length - 1; i >= 0; i--) {
        if (c.retention[i] !== null) { if (i > m) m = i; break; }
      }
    }
    return Math.max(m, 4);
  }, [recent]);

  const avg = useMemo(() => {
    const out: (number | null)[] = [];
    for (let i = 0; i <= maxOffset; i++) {
      let num = 0, den = 0, n = 0;
      for (const c of recent) {
        const v = c.retention[i];
        if (v === null || v === undefined) continue;
        num += v * c.cohortSize; den += c.cohortSize; n++;
      }
      out.push(n >= 2 && den > 0 ? num / den : null);
    }
    return out;
  }, [recent, maxOffset]);

  if (w1Coverage < 2) {
    return (
      <div style={{
        background: t.surface, border: `1px solid ${t.line}`, borderRadius: 22,
        boxShadow: t.shadowCard, padding: 20,
      }}>
        <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Retention curve</div>
        <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 12 }}>Percent of each cohort active in each following week.</div>
        <EmptyState title="Not enough cohorts yet" subtitle="Two cohorts need Week 1 data before an average can render." />
      </div>
    );
  }

  const H = 180, PAD_L = 32, PAD_R = 12, PAD_T = 12, PAD_B = 26;
  const [w, setW] = React.useState(360);
  const ref = React.useRef<HTMLDivElement | null>(null);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const innerW = w - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const x = (i: number) => PAD_L + (maxOffset === 0 ? 0 : (i / maxOffset) * innerW);
  const y = (pct: number) => PAD_T + innerH - (pct / 100) * innerH;

  const buildPath = (arr: (number | null)[]): string => {
    const segs: string[] = [];
    let pen = false;
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (v === null || v === undefined) { pen = false; continue; }
      segs.push(`${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`);
      pen = true;
    }
    return segs.join(' ');
  };

  // Y ticks: 0, 25, 50, 75, 100
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.line}`, borderRadius: 22,
      boxShadow: t.shadowCard, padding: 20,
    }}>
      <div style={{ color: t.ink, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Retention curve</div>
      <div style={{ color: t.inkMuted, fontSize: 12, marginBottom: 12 }}>Weighted average across the {recent.length} most recent cohorts.</div>

      <div ref={ref} style={{ width: '100%' }}>
        <svg width={w} height={H} style={{ display: 'block' }}>
          {yTicks.map((tk) => (
            <g key={tk}>
              <line x1={PAD_L} x2={w - PAD_R} y1={y(tk)} y2={y(tk)} stroke={t.line} strokeDasharray="3 3" />
              <text x={PAD_L - 6} y={y(tk) + 3} fontSize={10} fill={t.inkFaint} textAnchor="end" style={{ fontVariantNumeric: 'tabular-nums' }}>{tk}%</text>
            </g>
          ))}
          {Array.from({ length: maxOffset + 1 }, (_, i) => (
            <text key={i} x={x(i)} y={H - 8} fontSize={10} fill={t.inkFaint} textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>W{i}</text>
          ))}
          {recent.map((c, i) => {
            const opacity = 0.9 - (i * 0.18);
            return (
              <path key={i} d={buildPath(c.retention.slice(0, maxOffset + 1))}
                fill="none" stroke={t.brand} strokeWidth={1.25} strokeOpacity={opacity}
                strokeLinecap="round" strokeLinejoin="round" />
            );
          })}
          <path d={buildPath(avg)} fill="none" stroke={t.ink} strokeWidth={2.25}
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <LegendSwatch color={t.ink} label="Weighted average" thick />
        {recent.map((c, i) => (
          <LegendSwatch
            key={i}
            color={t.brand}
            opacity={0.9 - (i * 0.18)}
            label={`${c.cohortLabel} · ${c.cohortSize.toLocaleString()}`}
          />
        ))}
      </div>
    </div>
  );
}

function LegendSwatch({ color, label, opacity = 1, thick = false }: { color: string; label: string; opacity?: number; thick?: boolean }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 18, height: thick ? 3 : 2, background: color, opacity, borderRadius: 999 }} />
      <span style={{ color: adminThemeInkMuted, fontSize: 11.5, fontVariantNumeric: 'tabular-nums' }}>{label}</span>
    </div>
  );
}
const adminThemeInkMuted = t.inkMuted;

import React from 'react';
import { navyMid, inkGhost } from '../../utils/heroAtmosphere';

/**
 * <RoundSparkline> — cumulative round-by-round score progression mini-chart.
 * Used by Tour Hero results state and Player Scorecard tournament progression.
 *
 * Pass `accent` — `gold` for completed tournaments, `greenLive` for in-flight.
 * Provide `rounds` as an array of cumulative or per-round to-par numbers; the
 * component cumulates internally if `cumulative=false`.
 */
export function RoundSparkline({
  rounds,
  accent,
  cumulative = false,
  showLabels = true,
}: {
  rounds: (number | null)[];
  accent: string;
  /** if true, `rounds` is already cumulative; otherwise we cumulate internally */
  cumulative?: boolean;
  showLabels?: boolean;
}) {
  const filled = rounds.filter((r): r is number => r != null);
  if (filled.length < 2) return null;

  const SPARK_W = 320;
  const SPARK_H = 60;
  const INSET = 6;

  const series = cumulative
    ? filled
    : filled.reduce<number[]>((acc, r, i) => {
        acc.push((acc[i - 1] ?? 0) + r);
        return acc;
      }, []);

  const min = Math.min(0, ...series);
  const max = Math.max(0, ...series);
  const range = max - min || 1;
  const stepX = SPARK_W / Math.max(1, series.length - 1);

  const pts = series.map((v, i) => {
    const x = i * stepX;
    const y = SPARK_H - INSET - ((v - min) / range) * (SPARK_H - INSET * 2);
    return [x, y] as const;
  });
  const lastPt = pts[pts.length - 1];

  const path = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${path} L${lastPt[0].toFixed(1)},${SPARK_H} L0,${SPARK_H} Z`;

  // Tone the gradient stop colour to the accent at low alpha — accept any hex/hsl.
  const areaTop = `${accent}33`; // ≈0.20 opacity for #RRGGBB
  const areaBot = `${accent}00`;
  const gradId = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: SPARK_H, display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`rsArea-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={areaTop} />
            <stop offset="100%" stopColor={areaBot} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#rsArea-${gradId})`} />
        <path d={path} stroke={accent} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5} fill={accent} />
        ))}
        <circle cx={lastPt[0]} cy={lastPt[1]} r={5} fill={accent} stroke={navyMid} strokeWidth={2} />
      </svg>
      {showLabels && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 9,
            fontWeight: 700,
            color: inkGhost,
            letterSpacing: '0.06em',
          }}
        >
          {series.map((_, i) => (
            <span key={i}>R{i + 1}</span>
          ))}
        </div>
      )}
    </div>
  );
}

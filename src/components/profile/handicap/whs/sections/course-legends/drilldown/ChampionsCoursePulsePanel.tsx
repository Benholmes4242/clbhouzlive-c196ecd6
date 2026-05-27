import React from 'react';
import type { CourseMeta } from '@/hooks/gam/useCourseMeta';

interface Props {
  meta: CourseMeta | undefined;
}

const AMBER = '#F7931E';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface CellProps {
  label: string;
  value: string;
  sub?: string;
}

const Cell: React.FC<CellProps> = ({ label, value, sub }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, alignItems: 'center', textAlign: 'center' }}>
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: 'var(--hcp-t-40)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontFamily: FONT,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--hcp-t-100)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: FONT,
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--hcp-t-60)',
          letterSpacing: '0.04em',
          fontFamily: FONT,
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

export const ChampionsCoursePulsePanel: React.FC<Props> = ({ meta }) => {
  const crValue = meta?.course_cr != null ? meta.course_cr.toFixed(1) : '—';
  const crSub = meta?.course_par != null ? `par ${meta.course_par}` : undefined;

  const slopeValue = meta?.course_slope != null ? String(meta.course_slope) : '—';
  const slopeSub = (() => {
    if (meta?.course_slope == null) return undefined;
    if (meta.course_slope >= 135) return 'hard';
    if (meta.course_slope >= 120) return 'firm';
    if (meta.course_slope >= 105) return 'fair';
    return 'gentle';
  })();

  const hardest = meta?.hardest_hole;
  const hardestValue = hardest ? `H${hardest.hole_no}` : '—';
  const hardestSub = hardest
    ? `par ${hardest.par} · SI ${hardest.stroke_index}`
    : undefined;

  const avgValue =
    meta?.avg_over_par != null
      ? `+${Number(meta.avg_over_par).toFixed(1)}`
      : '—';
  const avgSub = 'over par';

  return (
    <div style={{ background: 'var(--hcp-bg-0)' }}>
      <div style={{ height: 1, background: AMBER }} aria-hidden />
      <div
        style={{
          padding: '10px 16px 0',
          fontSize: 10,
          fontWeight: 800,
          color: AMBER,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontFamily: FONT,
        }}
      >
        ↘ Course pulse
      </div>
      <div
        style={{
          padding: '12px 16px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
        }}
      >
        <Cell label="CR" value={crValue} sub={crSub} />
        <Cell label="Slope" value={slopeValue} sub={slopeSub} />
        <Cell label="Hardest" value={hardestValue} sub={hardestSub} />
        <Cell label="Avg" value={avgValue} sub={avgSub} />
      </div>
    </div>
  );
};

export default ChampionsCoursePulsePanel;

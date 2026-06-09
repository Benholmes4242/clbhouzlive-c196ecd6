import { GAM } from '../../../gam/tokens';
import React from 'react';
import type { CourseMeta } from '@/hooks/gam/useCourseMeta';

interface Props {
  meta: CourseMeta | undefined;
}

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface CellProps {
  label: string;
  value: string;
  sub?: string;
  showDivider?: boolean;
}

const Cell: React.FC<CellProps> = ({ label, value, sub, showDivider }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, alignItems: 'center', textAlign: 'center', position: 'relative', padding: '0 4px' }}>
    {showDivider && (
      <div aria-hidden style={{ position: 'absolute', left: 0, top: '10%', height: '80%', width: 1, background: 'rgba(15,23,42,0.07)' }} />
    )}
    <div style={{ fontSize: 9.5, fontWeight: 700, color: '#aab4c0', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: FONT }}>
      {label}
    </div>
    <div style={{ fontSize: 25, fontWeight: 300, color: 'var(--hcp-t-100)', letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: FONT }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 10, fontWeight: 500, color: '#9aa6b2', letterSpacing: '0.01em', fontFamily: FONT }}>
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

  const cells: CellProps[] = [
    { label: 'CR', value: crValue, sub: crSub },
    { label: 'Slope', value: slopeValue, sub: slopeSub },
    { label: 'Hardest', value: hardestValue, sub: hardestSub },
    { label: 'Avg', value: avgValue, sub: avgSub },
  ];

  return (
    <div style={{ background: 'var(--hcp-bg-0)' }}>
      <div
        style={{
          padding: '12px 18px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
        }}
      >
        {cells.map((c, i) => (
          <Cell key={c.label} {...c} showDivider={i > 0} />
        ))}
      </div>
    </div>
  );
};

export default ChampionsCoursePulsePanel;

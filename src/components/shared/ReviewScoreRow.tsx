/**
 * ReviewScoreRow — ONE review's overall and breakdown as the fullscreen
 * viewer's figure row (signed-off review-score-row mock). Cells in fixed
 * order OVERALL, DESIGN, CONDITION, CLUBHOUSE, FACILITIES; a null value drops
 * its cell; all-null renders nothing. Figures are always #FFFFFF. Every
 * single-review surface and ImmersiveFullscreenChrome use this so they
 * cannot drift. Course-level aggregates are out of scope.
 */
import React from 'react';
import { formatRatingValue } from '@/utils/formatters';

export interface ReviewScoreBreakdown {
  design: number | null;
  condition: number | null;
  clubhouse: number | null;
  facilities: number | null;
}

export interface ReviewScoreRowProps {
  overall: number | null;
  breakdown: ReviewScoreBreakdown;
  align?: 'center' | 'left';
  textShadow?: string;
  style?: React.CSSProperties;
}

const LABEL = 'rgba(255,255,255,0.50)';

const num = (v: number | null | undefined): number | null =>
  v == null || !Number.isFinite(Number(v)) ? null : Number(v);

export const ReviewScoreRow: React.FC<ReviewScoreRowProps> = ({ overall, breakdown, align = 'center', textShadow, style }) => {
  const cells = ([
    ['overall', 'OVERALL', num(overall)],
    ['design', 'DESIGN', num(breakdown.design)],
    ['condition', 'CONDITION', num(breakdown.condition)],
    ['clubhouse', 'CLUBHOUSE', num(breakdown.clubhouse)],
    ['facilities', 'FACILITIES', num(breakdown.facilities)],
  ] as const).filter((c) => c[2] != null) as [string, string, number][];
  if (cells.length === 0) return null;
  return (
    <div
      data-review-score-row
      style={{ display: 'flex', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: 15, ...(textShadow ? { textShadow } : null), ...style }}
    >
      {cells.map(([key, label, value]) => (
        <div key={key} data-score-cell={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span data-score-figure style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums lining-nums' }}>
            {formatRatingValue(value)}
          </span>
          <span data-score-label style={{ marginTop: 3, fontSize: 7, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: LABEL, whiteSpace: 'nowrap' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ReviewScoreRow;

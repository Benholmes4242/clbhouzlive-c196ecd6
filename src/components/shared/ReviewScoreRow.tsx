/**
 * ReviewScoreRow — ONE review's overall and breakdown, in two variants so
 * single-review surfaces cannot drift. Figures are always #FFFFFF; a null
 * value drops its cell; all-null renders nothing. Course aggregates are out
 * of scope.
 *  - 'card' (default, signed-off option A): grid `auto 1fr`, left edge,
 *    overall 26px leads behind a 1px hairline, then DESIGN, CONDITION,
 *    CLUBHOUSE, FACILITIES at 16px in four equal left-aligned columns
 *    (columnGap 8); labels 9px. No

 *    overall → no block/divider, breakdown takes the width; no breakdown →
 *    overall alone, no divider.
 *  - 'caption': the fullscreen viewer's small row (13.5px figures, 7px
 *    labels, gap 15) with the align and textShadow props. Also used by the
 *    narrow non-featured Explore ReviewTile for now.
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
  variant?: 'card' | 'caption';
  align?: 'center' | 'left';
  textShadow?: string;
  style?: React.CSSProperties;
}

const LABEL = 'rgba(255,255,255,0.50)';
const CARD_LABEL: React.CSSProperties = { marginTop: 5, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.42)', whiteSpace: 'nowrap' };
const TAB = 'tabular-nums lining-nums';

const num = (v: number | null | undefined): number | null =>
  v == null || !Number.isFinite(Number(v)) ? null : Number(v);

export const ReviewScoreRow: React.FC<ReviewScoreRowProps> = ({ overall, breakdown, variant = 'card', align = 'center', textShadow, style }) => {
  const cells = ([
    ['overall', 'OVERALL', num(overall)],
    ['design', 'DESIGN', num(breakdown.design)],
    ['condition', 'CONDITION', num(breakdown.condition)],
    ['clubhouse', 'CLUBHOUSE', num(breakdown.clubhouse)],
    ['facilities', 'FACILITIES', num(breakdown.facilities)],
  ] as const).filter((c) => c[2] != null) as [string, string, number][];
  if (cells.length === 0) return null;
  if (variant === 'card') {
    const ov = cells[0][0] === 'overall' ? cells[0] : null;
    const rest = ov ? cells.slice(1) : cells;
    return (
      <div data-review-score-row data-variant="card" style={{ display: 'grid', gridTemplateColumns: ov && rest.length ? 'auto 1fr' : '1fr', alignItems: 'end', width: '100%', ...style }}>
        {ov && (
          <div data-score-cell="overall" style={rest.length ? { paddingRight: 16, marginRight: 16, borderRight: '1px solid rgba(255,255,255,0.10)' } : undefined}>
            <div data-score-figure style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: '#FFFFFF', fontVariantNumeric: TAB }}>{formatRatingValue(ov[2])}</div>
            <div data-score-label style={CARD_LABEL}>{ov[1]}</div>
          </div>
        )}
        {rest.length > 0 && (
          <div data-score-breakdown style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', columnGap: 8 }}>
            {rest.map(([key, label, value]) => (
              <div key={key} data-score-cell={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                <div data-score-figure style={{ fontSize: 16, fontWeight: 600, lineHeight: 1, color: '#FFFFFF', fontVariantNumeric: TAB }}>{formatRatingValue(value)}</div>
                <div data-score-label style={CARD_LABEL}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div
      data-review-score-row
      data-variant="caption"
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

/**
 * ReviewScoreRow — ONE review's overall and breakdown, in two variants so
 * single-review surfaces cannot drift. Figures are always #FFFFFF; a null
 * value drops its cell; all-null renders nothing. Course aggregates are out
 * of scope.
 *  - 'card' (default, signed-off option A): grid `auto 1fr`, left edge,
 *    overall 26px leads behind a 1px hairline, then DESIGN, CONDITION,
 *    CLUBHOUSE, FACILITIES at 16px spread with even gaps (flex
 *    space-between, minimum columnGap 8), each figure centred over its own
 *    label; only present cells render; labels 9px. No

 *    overall → no block/divider, breakdown takes the width; no breakdown →
 *    overall alone, no divider.
 *  - 'tile' (FEED MEDIA CHROME §8, feed review cards): the same cells in a
 *    CHIP_GLASS tile, radius 18; Overall 34px left-aligned over its label,
 *    a 1px divider, then the breakdown at 19px spaced space-between; 8px
 *    labels. Narrow (<340px) sizes live in feed-media-chrome.css.
 *  - 'caption': the fullscreen viewer's small row (13.5px figures, 7px
 *    labels, gap 15) with the align and textShadow props. Also used by the
 *    narrow non-featured Explore ReviewTile for now.
 */
import React from 'react';
import { formatRatingValue } from '@/utils/formatters';
import { ScoreFigureRow } from './ScoreFigureRow';
import { CHIP_GLASS } from '@/lib/tokens/glass';
import '@/components/feed/feed-media-chrome.css';

const TILE_LABEL = 'rgba(248,250,252,0.62)';

export interface ReviewScoreBreakdown {
  design: number | null;
  condition: number | null;
  clubhouse: number | null;
  facilities: number | null;
}

export interface ReviewScoreRowProps {
  overall: number | null;
  breakdown: ReviewScoreBreakdown;
  variant?: 'card' | 'caption' | 'tile';
  align?: 'center' | 'left';
  textShadow?: string;
  style?: React.CSSProperties;
}

const LABEL = 'rgba(255,255,255,0.50)';
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
  if (variant === 'tile') {
    const ov = cells[0][0] === 'overall' ? cells[0] : null;
    const rest = ov ? cells.slice(1) : cells;
    const cell = ([key, label, value]: [string, string, number], lead: boolean) => (
      <div key={key} data-score-cell={key} {...(lead ? { 'data-score-tile-lead': '' } : { 'data-score-tile-cell': '' })} style={{ minWidth: 0, textAlign: lead ? 'left' : 'center' }}>
        <span data-score-figure style={{ display: 'block', fontWeight: 700, lineHeight: 1, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"kern" 1, "liga" 1' }}>{formatRatingValue(value)}</span>
        <span data-score-label style={{ display: 'block', marginTop: 4, fontWeight: 700, textTransform: 'uppercase', color: TILE_LABEL, whiteSpace: 'nowrap' }}>{label}</span>
      </div>
    );
    return (
      <div data-review-score-row data-review-score-container data-variant="tile" data-score-tile style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, boxSizing: 'border-box', minWidth: 0, ...CHIP_GLASS, ...style }}>
        {ov ? cell(ov, true) : null}
        {ov && rest.length ? <i aria-hidden data-score-tile-divider style={{ width: 1, alignSelf: 'stretch', flex: 'none', background: 'rgba(255,255,255,0.14)' }} /> : null}
        {rest.map((c) => cell(c, false))}
      </div>
    );
  }
  if (variant === 'card') {
    const ov = cells[0][0] === 'overall' ? cells[0] : null;
    const rest = ov ? cells.slice(1) : cells;
    return (
      <ScoreFigureRow
        name="review-score"
        lead={ov ? { key: ov[0], label: ov[1], value: formatRatingValue(ov[2]) } : null}
        cells={rest.map(([key, label, value]) => ({ key, label, value: formatRatingValue(value) }))}
        dividerColor="rgba(255,255,255,0.10)"
        cellWeight={600}
        style={style}
      />
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

/**
 * ScoreFigureRow — THE CARD-LAYOUT FIGURE ROW shared by ReviewScoreRow's 'card'
 * variant and the scorecard tile (SCORECARD_TILE_REDESIGN §1d). Layout only:
 * a lead figure (26px) behind a 1px hairline with 16px either side, then the
 * cells spread space-between (minimum column gap 8), each figure centred over a
 * 9px/700 .12em uppercase label, plus the narrow-width container rules.
 *
 * `name` scopes every data attribute and rule (`data-{name}-container`,
 * `data-{name}-row`), so the review tile's markup and CSS are byte-identical to
 * what ReviewScoreRow emitted before the extraction. Values arrive formatted;
 * nothing here knows what a rating or a to-par is.
 */
import React from 'react';

export interface ScoreFigureCell {
  key: string;
  value: string;
  label: string;
  /** Figure colour; default #FFFFFF. */
  color?: string;
}

export interface ScoreFigureRowProps {
  name: string;
  lead: ScoreFigureCell | null;
  cells: ScoreFigureCell[];
  dividerColor: string;
  /** Breakdown figure weight (review 600, scorecard 700). */
  cellWeight: 600 | 700;
  style?: React.CSSProperties;
}

const TAB = 'tabular-nums lining-nums';
export const SCORE_FIGURE_LABEL: React.CSSProperties = { marginTop: 5, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.42)', whiteSpace: 'nowrap' };

export function scoreFigureRules(name: string, leadKey: string): string {
  const row = `[data-${name}-row][data-variant="card"]`;
  return `
@container (max-width: 400px) {
  ${row} [data-score-cell="${leadKey}"][data-score-divider] { padding-right: 12px !important; margin-right: 12px !important; }
  ${row} [data-score-breakdown] { column-gap: 6px !important; }
  ${row} [data-score-label] { letter-spacing: 0.04em !important; }
}
@container (max-width: 330px) {
  ${row} [data-score-label] { font-size: 8px !important; }
  ${row} [data-score-cell="${leadKey}"] [data-score-figure] { font-size: 23px !important; }
}
`;
}

export const ScoreFigureRow: React.FC<ScoreFigureRowProps> = ({ name, lead, cells, dividerColor, cellWeight, style }) => {
  if (!lead && cells.length === 0) return null;
  const containerAttrs = { [`data-${name}-container`]: '' } as Record<string, string>;
  const rulesAttrs = { [`data-${name}-container-rules`]: '' } as Record<string, string>;
  const rowAttrs = { [`data-${name}-row`]: '', 'data-variant': 'card' } as Record<string, string>;
  return (
    <div {...containerAttrs} style={{ containerType: 'inline-size', width: '100%', minWidth: 0 }}>
      <style {...rulesAttrs}>{scoreFigureRules(name, lead?.key ?? 'overall')}</style>
      <div {...rowAttrs} style={{ display: 'grid', gridTemplateColumns: lead && cells.length ? 'auto 1fr' : '1fr', alignItems: 'end', width: '100%', ...style }}>
        {lead && (
          <div data-score-cell={lead.key} data-score-divider={cells.length ? '' : undefined} style={cells.length ? { paddingRight: 16, marginRight: 16, borderRight: `1px solid ${dividerColor}` } : undefined}>
            <div data-score-figure style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, color: lead.color ?? '#FFFFFF', fontVariantNumeric: TAB }}>{lead.value}</div>
            <div data-score-label style={SCORE_FIGURE_LABEL}>{lead.label}</div>
          </div>
        )}
        {cells.length > 0 && (
          <div data-score-breakdown style={{ display: 'flex', justifyContent: 'space-between', columnGap: 8 }}>
            {cells.map((c) => (
              <div key={c.key} data-score-cell={c.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div data-score-figure style={{ fontSize: 16, fontWeight: cellWeight, lineHeight: 1, color: c.color ?? '#FFFFFF', fontVariantNumeric: TAB }}>{c.value}</div>
                <div data-score-label style={SCORE_FIGURE_LABEL}>{c.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreFigureRow;

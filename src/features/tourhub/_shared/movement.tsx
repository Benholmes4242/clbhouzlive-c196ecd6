/**
 * Shared ranking-movement helpers.
 *
 * movementFrom  - the canonical `prior_rank - rank` arithmetic (positive =
 *                 climbed, negative = fell). Moved verbatim out of
 *                 overview/data/useRankingsBoards.ts.
 * MovementFigure - the canonical movement cell, extracted verbatim from the
 *                 inline JSX in overview/sections/WorldRankings.tsx so that
 *                 surface renders identically after the extraction.
 *
 * `nullPlaceholder` defaults to 'dash' to preserve the overview's existing
 * output. New surfaces pass 'none': absent values render nothing.
 */

import { V4 } from '../overview/tokens';

export function movementFrom(rank: number, prior: number | null): number | null {
  if (prior == null) return null;
  return prior - rank;
}

export function MovementFigure({
  movement,
  nullPlaceholder = 'dash',
  variant = 'column',
}: {
  movement: number | null;
  nullPlaceholder?: 'dash' | 'none';
  variant?: 'column' | 'inline';
}) {
  const inline = variant === 'inline';
  const base: React.CSSProperties = inline
    ? {
        display: 'inline',
        minWidth: 0,
        textAlign: 'left',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        letterSpacing: 'inherit',
        fontVariantNumeric: 'tabular-nums',
      }
    : {
        minWidth: 34,
        textAlign: 'right',
        fontSize: 11,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      };

  const Tag = (inline ? 'span' : 'div') as 'span' | 'div';

  if (movement != null && movement !== 0) {
    return (
      <Tag style={{ ...base, color: movement > 0 ? V4.up : V4.down }}>
        {movement > 0 ? '\u25B2' : '\u25BC'} {Math.abs(movement)}
      </Tag>
    );
  }
  if (nullPlaceholder === 'none') return null;
  return (
    <Tag style={{ ...base, color: V4.inkFaint, fontWeight: inline ? 'inherit' : undefined }}>
      {'\u2014'}
    </Tag>
  );
}



export default MovementFigure;

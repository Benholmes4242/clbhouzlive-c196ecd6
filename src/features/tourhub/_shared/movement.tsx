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
}: {
  movement: number | null;
  nullPlaceholder?: 'dash' | 'none';
}) {
  if (movement != null && movement !== 0) {
    return (
      <div
        style={{
          minWidth: 34,
          textAlign: 'right',
          fontSize: 11,
          fontWeight: 800,
          color: movement > 0 ? V4.up : V4.down,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {movement > 0 ? '\u25B2' : '\u25BC'} {Math.abs(movement)}
      </div>
    );
  }
  if (nullPlaceholder === 'none') return null;
  return (
    <div style={{ minWidth: 34, textAlign: 'right', fontSize: 11, color: V4.inkFaint }}>
      {'\u2014'}
    </div>
  );
}

export default MovementFigure;

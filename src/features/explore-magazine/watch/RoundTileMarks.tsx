/**
 * ROUND TILE MARKS (BUILD Round scores §1, round-tiles-signed-off.html) — the
 * shelf tiles' hole strip is the score post's HoleMarks (the same component
 * roundTilePlot.tsx uses), never a second palette. Two rows of nine — front
 * nine on top, back nine underneath, 6px between the rows — at the full width
 * of the tile's content; a nine-hole round draws ONE row. Unplayed holes keep
 * HoleMarks' empty dot. --hm-surface is the tile background so the double
 * mark's inner gap reads as the card, and `raised` carries the standout
 * shelf's feat-hole highlight (data-raised) onto the matching mark.
 */
import { HoleMarks, type HoleMarkCell } from '@/features/tourhub/leaderboard/BoardRound';
import '@/features/tourhub/leaderboard/leaderboard.css';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { SHELF_CARD } from './roundsShelfRules';

/** Played holes land on their number; everything else stays an empty dot. */
export function tileMarkCells(shape: HoleShape): (HoleMarkCell | null)[] {
  const cells: (HoleMarkCell | null)[] = Array.from({ length: 18 }, () => null);
  for (const hole of shape.holes) {
    if (hole.holeNo >= 1 && hole.holeNo <= 18) {
      cells[hole.holeNo - 1] = { strokes: hole.strokes, par: hole.par };
    }
  }
  return cells;
}

export function isNineHoleShape(shape: HoleShape): boolean {
  return shape.holes.length <= 9 && !shape.holes.some((hole) => hole.holeNo > 9);
}

export function RoundTileMarks({ shape, raised = null }: { shape: HoleShape; raised?: number | null }) {
  const cells = tileMarkCells(shape);
  if (isNineHoleShape(shape)) {
    return (
      <span data-round-tile-marks="nine" aria-hidden style={{ display: 'block', marginTop: 14 }}>
        <HoleMarks holes={cells.slice(0, 9)} surface={SHELF_CARD.background} raised={raised} />
      </span>
    );
  }
  return (
    <span data-round-tile-marks="eighteen" aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
      <HoleMarks holes={cells.slice(0, 9)} surface={SHELF_CARD.background} raised={raised} />
      <HoleMarks holes={cells.slice(9)} surface={SHELF_CARD.background} raised={raised != null ? raised - 9 : null} />
    </span>
  );
}

export default RoundTileMarks;

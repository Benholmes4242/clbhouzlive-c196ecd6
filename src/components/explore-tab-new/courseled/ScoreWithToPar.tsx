import type { CSSProperties } from 'react';
import { A } from './tokens';
import { fmtToPar } from './scoreToPar';

/** CB12 — CompetitionBoards, StandoutRounds and recent BoardRows share this
 * atom. The figure never turns red; only its own under-par suffix does.
 * Optional figure presentation preserves each established surface's scale. */
export function ScoreWithToPar({ score, par, kind, fontSize, tone, lineHeight = 1.25, fontWeight = 700, scoreHandle }: {
  score: number | null;
  par: number | null;
  kind: 'net' | 'gross';
  fontSize: number;
  tone?: string;
  lineHeight?: CSSProperties['lineHeight'];
  fontWeight?: number;
  /** Existing board handles identify the score itself, not its suffix. */
  scoreHandle?: 'main' | 'secondary';
}) {
  const under = score != null && par != null && score < par;
  const figure = score ?? '\u2014';
  return (
    <span data-gate-blur="" className="tabular-nums" style={{ lineHeight, fontSize, fontWeight, color: tone ?? (kind === 'net' ? A.INK : A.FAINT) }}>
      {scoreHandle ? <span data-gate-blur="" data-board-main={scoreHandle === 'main' ? '' : undefined} data-board-secondary={scoreHandle === 'secondary' ? '' : undefined}>{figure}</span> : figure}
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.01em', marginLeft: 3, color: under ? A.RED : A.DIM, lineHeight: 1 }}>{score == null || par == null ? '' : fmtToPar(score - par)}</span>
    </span>
  );
}
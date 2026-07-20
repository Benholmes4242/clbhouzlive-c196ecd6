/**
 * tiVerdict — single source of truth for the Tournament Intelligence
 * result treatment (card chip, case banner, board row chip, last-5 tokens).
 * No surface computes its own colors: they all route through TiVerdictKind.
 */
import type { PickLiveState } from '../data/usePickLiveState';

export type TiVerdictKind = 'win' | 'top20' | 'out' | 'mc' | 'none';

export interface TiVerdict {
  kind: TiVerdictKind;
  /** e.g. "T4"/"4", "MC"/"WD"/"DQ", "1" for a win. null when kind='none'. */
  label: string | null;
  /** Signed score, "-7" / "+1" / "E". null when unknown or cut. */
  score: string | null;
}

const CUT_STATUSES = new Set(['CUT', 'MC', 'WD', 'DQ', 'MDF']);

export function formatTiScore(score: number | null | undefined): string | null {
  if (score == null || !Number.isFinite(score)) return null;
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : String(score);
}

export function formatTiPosition(pos: number, tied: boolean): string {
  return `${tied ? 'T' : ''}${pos}`;
}

export function tiVerdict(live: PickLiveState | null | undefined): TiVerdict {
  if (!live) return { kind: 'none', label: null, score: null };
  const status = (live.status ?? '').toUpperCase();
  if (CUT_STATUSES.has(status)) {
    const label = status === 'WD' || status === 'DQ' ? status : 'MC';
    return { kind: 'mc', label, score: null };
  }
  if (live.position == null) return { kind: 'none', label: null, score: null };
  const pos = live.position;
  const posText = formatTiPosition(pos, !!live.positionTied);
  const score = formatTiScore(live.score);
  if (pos === 1) return { kind: 'win', label: '1', score };
  if (pos <= 20) return { kind: 'top20', label: posText, score };
  return { kind: 'out', label: posText, score };
}

/** Convenience: build a PickLiveState-shape from a settled result row. */
export function verdictFromResult(row: {
  position: number | null;
  position_tied: boolean | null;
  score: number | null;
  status: string | null;
}): TiVerdict {
  return tiVerdict({
    position: row.position,
    positionTied: !!row.position_tied,
    score: row.score,
    status: row.status,
    today: null,
    thru: null,
  });
}

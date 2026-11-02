import type { StandoutRound } from '@/components/explore-tab-new/courseled/hooks/useStandoutRounds';
import type { FeatKind, FeatYearRow } from '../useFeatsWindow';

/**
 * ROUNDS THIS WEEK SHELF — the pure rules (RS §3).
 *
 * The shelf reads the board's own "circle / last 14 days" standout rows (limit
 * 4 is the RPC argument's own value) and the year's feats, and interleaves
 * them round, round, feat, round, round, feat. Everything here is pure: no
 * hooks, no locale, no DOM.
 */

/** The shelf's window is the board's own "last 14 days" value. */
export const SHELF_WINDOW_DAYS = 14;

/** Feat display order, rarest first — the RPC's own display order. */
export const SHELF_FEAT_ORDER: FeatKind[] = ['ace', 'albatross', 'eagle', 'clean_card'];

/** At most two feat cards. */
export const SHELF_FEAT_CAP = 2;

/** A feat earns a card only when its latest occurrence is inside the window
 *  and carries a round to open. */
export function eligibleFeats(rows: FeatYearRow[], now: Date = new Date()): FeatYearRow[] {
  const cutoff = now.getTime() - SHELF_WINDOW_DAYS * 86_400_000;
  const byKind = new Map(rows.map((row) => [row.feat_kind, row]));
  const out: FeatYearRow[] = [];
  for (const kind of SHELF_FEAT_ORDER) {
    const row = byKind.get(kind);
    if (!row || !row.latest_score_id || !row.latest_play_date) continue;
    const when = new Date(row.latest_play_date).getTime();
    if (Number.isNaN(when) || when < cutoff) continue;
    out.push(row);
  }
  return out.slice(0, SHELF_FEAT_CAP);
}

export type ShelfCard =
  | { kind: 'round'; round: StandoutRound }
  | { kind: 'feat'; feat: FeatYearRow };

/** round, round, feat, round, round, feat — a missing slot closes up, no gap. */
export function buildShelfCards(rounds: StandoutRound[], feats: FeatYearRow[]): ShelfCard[] {
  const pattern: Array<ShelfCard['kind']> = ['round', 'round', 'feat', 'round', 'round', 'feat'];
  const out: ShelfCard[] = [];
  let ri = 0;
  let fi = 0;
  for (const slot of pattern) {
    if (slot === 'round' && ri < rounds.length) out.push({ kind: 'round', round: rounds[ri++] });
    else if (slot === 'feat' && fi < feats.length) out.push({ kind: 'feat', feat: feats[fi++] });
  }
  return out;
}

/** Net to par, from the round's own figures; null when either is missing. */
export function roundToPar(round: StandoutRound): number | null {
  if (round.net_score == null || round.course_par == null) return null;
  return round.net_score - round.course_par;
}

/** "−1" / "E" / "+2" (U+2212 minus, as the mock); null when unknowable. */
export function toParLabel(toPar: number | null): string | null {
  if (toPar == null) return null;
  if (toPar === 0) return 'E';
  return toPar < 0 ? `−${Math.abs(toPar)}` : `+${toPar}`;
}

/** Under par is the surface's red; level and over are mute. */
export const TO_PAR_UNDER = '#E24B3F';

/** The strip's scorecard palette, per the signed-off mock. */
export const STRIP_COLORS = {
  eagle: '#E8C766',
  birdie: '#E24B3F',
  par: 'rgba(255,255,255,0.14)',
  bogey: '#A6C2F0',
  double: '#7AA6EC',
} as const;

/** One bar's colour from the hole's actual gross against par. */
export function stripColor(strokes: number | null, par: number | null): string {
  if (strokes == null || par == null) return STRIP_COLORS.par;
  const diff = strokes - par;
  if (diff <= -2) return STRIP_COLORS.eagle;
  if (diff === -1) return STRIP_COLORS.birdie;
  if (diff === 0) return STRIP_COLORS.par;
  if (diff === 1) return STRIP_COLORS.bogey;
  return STRIP_COLORS.double;
}

/** Card geometry and paint, named once (RS §3, mock A/C). */
export const SHELF_CARD = {
  width: 232,
  height: 214,
  background: '#17171B',
  border: 'rgba(255,255,255,0.08)',
  radius: 18,
  padding: 14,
  gap: 10,
} as const;

export const SHELF_DOOR = {
  height: 50,
  radius: 14,
  background: '#17171B',
  border: 'rgba(255,255,255,0.08)',
} as const;

export const FEAT_TILE = { height: 78, radius: 12, background: '#1E1E23' } as const;

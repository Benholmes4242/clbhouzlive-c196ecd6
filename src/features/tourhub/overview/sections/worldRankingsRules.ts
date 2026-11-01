/**
 * Pure rules for the rebuilt World rankings section (signed-off mock:
 * world-rankings-signed-off.html). No hooks, no fetches — every rule here is
 * unit-tested directly so the component stays a thin renderer.
 *
 * - leadSentence: the one-sentence "how it stands" line above the board.
 * - pickBiggestClimb: the largest positive 90-day movement inside the top 50.
 * - sparkline: the 84×30 rank-history line on the climber card.
 */

export interface SentenceRow {
  playerName: string;
  points: number | null;
}

export type LeadClause = 'twice' | 'nearly' | 'plain';

export type LeadSentence =
  | { kind: 'level'; values: { name: string; other: string; points: string } }
  | {
      kind: 'leads';
      values: { name: string; gap: string };
      clause: LeadClause;
      /** Season boards only: remaining events, or null when not countable. */
      eventsLeft: number | null;
    };

/** Last token of the full name ("Rasmus Højgaard" -> "Højgaard"). */
export function surnameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? fullName;
}

/** en-GB thousands separators on the rounded figure. */
export function fmtPoints(points: number): string {
  return Math.round(points).toLocaleString('en-GB');
}

/**
 * The sentence. Needs the top two rows WITH points; no points -> no sentence.
 * Level at the top wins over every other form. Ratio clauses: No. 1 >= 2x
 * No. 2 -> "more than twice"; >= 1.75x -> "nearly twice"; otherwise plain.
 * Positive `eventsLeft` (season boards only) replaces the closing full stop;
 * zero and an uncountable total both omit the clause.
 */
export function leadSentence(rows: SentenceRow[], eventsLeft: number | null): LeadSentence | null {
  const [first, second] = rows;
  if (!first || !second) return null;
  if (first.points == null || second.points == null) return null;
  const p1 = first.points;
  const p2 = second.points;
  if (p1 === p2) {
    return {
      kind: 'level',
      values: { name: surnameOf(first.playerName), other: surnameOf(second.playerName), points: fmtPoints(p1) },
    };
  }
  const ratio = p2 > 0 ? p1 / p2 : Infinity;
  const clause: LeadClause = ratio >= 2 ? 'twice' : ratio >= 1.75 ? 'nearly' : 'plain';
  return {
    kind: 'leads',
    values: { name: surnameOf(first.playerName), gap: fmtPoints(p1 - p2) },
    clause,
    eventsLeft: eventsLeft === 0 ? null : eventsLeft,
  };
}

export interface ClimbRow {
  rank: number;
  playerId: string | null;
  playerName: string;
  movement: number | null;
}

/**
 * Biggest climb in the top 50: largest POSITIVE movement; a tie goes to the
 * better (lower) current rank. Nobody climbed -> no card.
 */
export function pickBiggestClimb<T extends ClimbRow>(rows: T[]): T | null {
  let best: T | null = null;
  for (const row of rows) {
    if (row.movement == null || row.movement <= 0 || !row.playerId) continue;
    if (!best || row.movement > (best.movement ?? 0) || (row.movement === best.movement && row.rank < best.rank)) {
      best = row;
    }
  }
  return best;
}

export interface RankSnapshot {
  rank: number;
  ranking_date: string;
}

export interface Sparkline {
  /** "x,y x,y …" polyline points, oldest to latest. */
  points: string;
  /** Latest point, for the 3px dot. */
  last: { x: number; y: number };
}

/**
 * The climber's rank line: every stored snapshot in the window, better ranks
 * higher, scaled between the player's own best and worst rank with 3px
 * padding. Fewer than three snapshots -> no line (the text stays).
 */
export function sparkline(snapshots: RankSnapshot[], width = 84, height = 30): Sparkline | null {
  const sorted = [...snapshots].sort((a, b) => a.ranking_date.localeCompare(b.ranking_date));
  if (sorted.length < 3) return null;
  const ranks = sorted.map((s) => s.rank);
  const best = Math.min(...ranks);
  const worst = Math.max(...ranks);
  const span = worst - best;
  const pts = sorted.map((s, i) => {
    const x = (i / (sorted.length - 1)) * (width - 6) + 3;
    // Better rank (smaller number) sits higher (smaller y). Flat history
    // (best === worst) parks the line at vertical centre.
    const y = span === 0 ? height / 2 : 3 + ((s.rank - best) / span) * (height - 6);
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  });
  return { points: pts.map((p) => `${p.x},${p.y}`).join(' '), last: pts[pts.length - 1] };
}

/** en-GB ordinal: 1st, 2nd, 3rd, 4th … 27th. */
export function ordinalEn(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** "2026-07-27" -> "27 Jul" (en-GB; the header uppercases it via CSS). */
export function sinceLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

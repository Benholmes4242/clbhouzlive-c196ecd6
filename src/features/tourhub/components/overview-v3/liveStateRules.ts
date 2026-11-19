/** TOUR OVERVIEW LIVE STATES — pure rules for the seven live-phase states
 * (state.kind 'live' | 'suspended'). The upcoming and completed phases and
 * Also this week never read this file. Every figure comes from the board
 * entries and tournament meta the overview already loads, plus the hole
 * analysis for the course row. A figure with no data DROPS its cell: never a
 * dash or a zero. The cut cell has one source, resolveCutDisplay. */
import { fieldHasStarted } from '../../overview/boardStarted';
import { todayFromEntry, type BoardEntry } from '../../leaderboard/BoardTable';
import { resolveCutDisplay, type CutInput } from '../../_shared/cutDisplay';
import { fmtScore } from '../../utils/fmtScore';
import { surnameOf } from '../../_shared/playerName';

export type LiveStage = 'beforeTee' | 'round1' | 'inPlay' | 'between' | 'cutRound' | 'afterCut' | 'suspended' | 'final';

const OUT = new Set(['MC', 'CUT', 'WD', 'DQ', 'DNS', 'MDF']);
const statusOf = (e: BoardEntry) => (e.status ?? '').toUpperCase();
export const isActiveEntry = (e: BoardEntry) => !OUT.has(statusOf(e));
export const missedCut = (e: BoardEntry) => statusOf(e) === 'MC' || statusOf(e) === 'CUT';
/** The round score of round r, read only from that round (never yesterday's). */
export const roundScoreOf = (e: BoardEntry, r: number) => todayFromEntry(e, r);
const throughIn = (e: BoardEntry, r: number) => roundScoreOf(e, r) != null && (e.thru ?? 0) >= 18;

/**
 * BETWEEN ROUNDS: a round is complete and the next has not started. The
 * provider shows this two ways: (a) current_round has already advanced but its
 * column has no scores, or (b) current_round has not advanced but every active
 * player is through 18. Returns the round just finished, else null. A pre-start
 * field (nobody has a score) is never between rounds.
 */
export function betweenRounds(entries: BoardEntry[], currentRound: number | null | undefined, currentRoundStatus?: string | null): number | null {
  if (currentRound == null || currentRound < 1 || !fieldHasStarted(entries)) return null;
  const active = entries.filter(isActiveEntry);
  if (active.length === 0) return null;
  // (a) advanced, column empty.
  if (currentRound >= 2 && active.every(e => roundScoreOf(e, currentRound) == null)) return currentRound - 1;
  // (b) not advanced, everyone through 18 in THIS round. The round must be
  // named explicitly (its column, or today_round), so a stale unlabelled
  // `today` with a stale thru 18 can never read as a finished round. A
  // 'closed'/'complete' round status agrees but is not required.
  void currentRoundStatus;
  const explicit = (e: BoardEntry) => [e.round_1, e.round_2, e.round_3, e.round_4][currentRound - 1] != null || e.today_round === currentRound;
  if (active.every(e => throughIn(e, currentRound) && explicit(e))) return currentRound;
  return null;
}

export interface LiveStageInput {
  kind: 'live' | 'suspended';
  round: number;
  totalRounds: number;
  entries: BoardEntry[];
  currentRoundStatus?: string | null;
  cutRound?: number | null;
}

export interface LiveStageResult {
  stage: LiveStage;
  /** The round the board/course describe: in play, suspended, or just finished (between). */
  round: number;
  /** Between rounds only: the round whose tee times the board shows. */
  nextRound: number | null;
}

export function liveStage({ kind, round, totalRounds, entries, currentRoundStatus, cutRound }: LiveStageInput): LiveStageResult {
  if (kind === 'suspended') return { stage: 'suspended', round, nextRound: null };
  if (!fieldHasStarted(entries)) return { stage: 'beforeTee', round, nextRound: null };
  const done = betweenRounds(entries, round, currentRoundStatus);
  if (done != null && done < totalRounds) return { stage: 'between', round: done, nextRound: done + 1 };
  if (round >= totalRounds) return { stage: 'final', round, nextRound: null };
  if (cutRound != null && round === cutRound) return { stage: 'cutRound', round, nextRound: null };
  if (cutRound != null && round > cutRound) return { stage: 'afterCut', round, nextRound: null };
  return { stage: round === 1 ? 'round1' : 'inPlay', round, nextRound: null };
}

export type LiveFactKey = 'field' | 'purse' | 'par' | 'yards' | 'onCourse' | 'finished' | 'toFinish' | 'lowRound' | 'scoringAvg' | 'underPar' | 'projCut' | 'cut' | 'madeCut' | 'lead' | 'tied';
export interface LiveFactCell { key: LiveFactKey; value: string; /** to-par figures carry the score colour; null = ink. */ toPar: number | null }

export interface LiveFactInput {
  stage: LiveStage;
  round: number;
  entries: BoardEntry[];
  par: number | null;
  yards?: number | null;
  purse?: number | null;
  cut: CutInput;
}

export function formatPurse(purse: number): string {
  return `$${purse >= 1000000 ? `${Number((purse / 1000000).toFixed(1))}M` : purse.toLocaleString('en-GB')}`;
}

export function liveFactCells({ stage, round, entries, par, yards = null, purse = null, cut }: LiveFactInput): LiveFactCell[] {
  const ink = (key: LiveFactKey, n: number | null | undefined, text?: string): LiveFactCell | null => n == null || !Number.isFinite(n) ? null : { key, value: text ?? String(n), toPar: null };
  const toPar = (key: LiveFactKey, n: number | null | undefined): LiveFactCell | null => n == null || !Number.isFinite(n) ? null : { key, value: fmtScore(n), toPar: n };
  const active = entries.filter(isActiveEntry);
  const started = entries.length > 0;
  if (stage === 'beforeTee') {
    return [ink('field', entries.length > 0 ? entries.length : null), purse != null ? { key: 'purse' as const, value: formatPurse(purse), toPar: null } : null,
      ink('par', par), yards != null ? { key: 'yards' as const, value: yards.toLocaleString('en-GB'), toPar: null } : null]
      .filter((c): c is LiveFactCell => c !== null);
  }
  if (!started) return [];
  const scores = entries.map(e => roundScoreOf(e, round)).filter((v): v is number => v != null);
  const finishedRows = entries.filter(e => throughIn(e, round));
  const onCourse = entries.filter(e => roundScoreOf(e, round) != null && (e.thru ?? 0) >= 1 && (e.thru ?? 0) <= 17).length;
  const finished = finishedRows.length;
  const toFinish = active.filter(e => !throughIn(e, round)).length;
  const low = scores.length ? Math.min(...scores) : null;
  const finishedToPar = finishedRows.map(e => roundScoreOf(e, round) as number);
  const avg = par != null && finishedToPar.length ? par + finishedToPar.reduce((a, b) => a + b, 0) / finishedToPar.length : null;
  const avgCell = avg == null ? null : { key: 'scoringAvg' as const, value: avg.toFixed(2), toPar: null };
  const underPar = active.filter(e => e.score != null && e.score < 0).length;
  const shown = resolveCutDisplay(cut);
  const cutCell: LiveFactCell | null = shown.kind === 'none' || shown.cutline == null ? null
    : { key: shown.kind === 'projected' ? 'projCut' : 'cut', value: fmtScore(shown.cutline), toPar: shown.cutline };
  const count = (key: LiveFactKey, n: number) => ({ key, value: String(n), toPar: null });
  const cells: Array<LiveFactCell | null> = (() => {
    switch (stage) {
      case 'between': return [toPar('lowRound', low), avgCell, count('underPar', underPar), cutCell];
      case 'cutRound': return [count('onCourse', onCourse), count('finished', finished), toPar('lowRound', low), cutCell ?? avgCell];
      case 'afterCut': return [count('onCourse', onCourse), count('finished', finished), toPar('lowRound', low), count('madeCut', entries.filter(e => !missedCut(e)).length)];
      case 'suspended': return [count('toFinish', toFinish), count('finished', finished), toPar('lowRound', low), cutCell ?? avgCell];
      case 'final': return [count('onCourse', onCourse), count('finished', finished), toPar('lowRound', low), leadCell(entries)];
      default: return [count('onCourse', onCourse), count('finished', finished), toPar('lowRound', low), avgCell];
    }
  })();
  return cells.filter((c): c is LiveFactCell => c !== null);
}

/** LEAD: the margin between 1st and 2nd; a tied 1st reads TIED with "T{n}". */
export function leadCell(entries: BoardEntry[]): LiveFactCell | null {
  const ranked = entries.filter(e => isActiveEntry(e) && e.score != null).sort((a, b) => (a.score as number) - (b.score as number));
  if (ranked.length < 2) return null;
  const top = ranked[0].score as number;
  const tied = ranked.filter(e => e.score === top).length;
  if (tied > 1) return { key: 'tied', value: `T${tied}`, toPar: null };
  return { key: 'lead', value: String((ranked[1].score as number) - top), toPar: null };
}

/* ---------- Course: field average to par per hole ---------- */

export const HOLE_AVG_MIN_PLAYERS = 10;

/** "−.08" / "+.21"; "+1.02" at 1 or above; "E" when it rounds to 0.00. */
export function formatHoleAvg(v: number): string {
  const r = Math.round(v * 100) / 100;
  if (r === 0) return 'E';
  const abs = Math.abs(r);
  const body = abs >= 1 ? abs.toFixed(2) : abs.toFixed(2).replace(/^0/, '');
  return `${r < 0 ? '\u2212' : '+'}${body}`;
}

export interface HoleAvgInput { hole_no: number; avg_to_par: number; rounds: number }
export interface HoleAvgCell { hole: number; value: number | null; text: string; mark: 'hardest' | 'easiest' | null }
export interface HoleAvgRow { holes: HoleAvgCell[]; out: number | null; in: number | null; total: number | null; hardest: number | null; easiest: number | null }

export function holeAverages(holes: HoleAvgInput[] | null | undefined): HoleAvgRow {
  const by = new Map<number, number>();
  for (const h of holes ?? []) if (h && h.rounds >= HOLE_AVG_MIN_PLAYERS && Number.isFinite(h.avg_to_par)) by.set(h.hole_no, h.avg_to_par);
  let hardest: number | null = null;
  let easiest: number | null = null;
  for (let n = 1; n <= 18; n += 1) {
    const v = by.get(n);
    if (v == null) continue;
    if (hardest == null || v > (by.get(hardest) as number)) hardest = n;
    if (easiest == null || v < (by.get(easiest) as number)) easiest = n;
  }
  if (hardest != null && hardest === easiest) easiest = null;
  const sum = (from: number) => {
    let s = 0;
    for (let n = from; n < from + 9; n += 1) { const v = by.get(n); if (v == null) return null; s += v; }
    return s;
  };
  const out = sum(1);
  const inn = sum(10);
  return {
    holes: Array.from({ length: 18 }, (_, i) => {
      const n = i + 1; const v = by.get(n) ?? null;
      return { hole: n, value: v, text: v == null ? '' : formatHoleAvg(v), mark: n === hardest ? 'hardest' : n === easiest ? 'easiest' : null };
    }),
    out, in: inn, total: out != null && inn != null ? out + inn : null, hardest, easiest,
  };
}

export const HOLE_AVG_OVER = 'rgba(242,244,247,.62)';
export const HOLE_AVG_UNDER = '#E24B3F';
export const HOLE_AVG_HARD = '#F8FAFC';
export function holeAvgColor(v: number | null, mark: HoleAvgCell['mark'] = null): string {
  if (mark === 'hardest') return HOLE_AVG_HARD;
  if (v == null) return HOLE_AVG_OVER;
  return Math.round(v * 100) / 100 < 0 ? HOLE_AVG_UNDER : HOLE_AVG_OVER;
}

export function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
}

/* ---------- Board ---------- */

/** "M. Greyserman" — first initial + surname, for ≤340px boards. */
export function initialSurname(fullName: string | null | undefined): string {
  const name = (fullName ?? '').trim();
  if (!name) return '';
  const surname = surnameOf(name);
  const first = name.slice(0, Math.max(0, name.length - surname.length)).trim();
  return first ? `${first[0]}. ${surname}` : surname;
}

export const NARROW_MAX = 340;

/* ---------- Picks heading ---------- */

export function livePicksHeading(stage: LiveStage, round: number, t: (k: string, o?: Record<string, unknown>) => string): { full: string; short: string } {
  switch (stage) {
    case 'beforeTee': return { full: t('overview.live.picks.teeToday'), short: t('overview.live.picks.today') };
    case 'between': return { full: t('overview.live.picks.teeTimes', { round: round + 1 }), short: t('overview.live.picks.teeTimesShort') };
    case 'suspended': return { full: t('overview.live.picks.suspended', { round }), short: t('overview.live.picks.suspendedShort') };
    case 'final': return { full: t('overview.live.picks.finalLive'), short: t('overview.live.picks.live') };
    default: return { full: t('overview.live.picks.roundLive', { round }), short: t('overview.live.picks.live') };
  }
}

/** Tee-sheet start label: 1st or 10th tee. */
export const teeStartKey = (startingHole: number | null | undefined) => (startingHole === 10 ? 'tenth' : 'first');

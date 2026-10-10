/**
 * HybridHero utilities — state derivation, score formatting, tie detection.
 * Per §3 + §7 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import { formatMonthDay } from '@/i18n/format';
import type { HeroTournament } from '../../hooks/useHeroCarouselData';
import { getScoreColor } from '../../_shared/scoreColor';
import { surnameOf } from '../../_shared/playerName';
import type { BoardEntry } from '../../leaderboard/BoardTable';

// ---------- Types -----------------------------------------------------------

export type ResultsVariant =
  | 'standard'
  | 'playoff'
  | 'declared'
  | 'cancelled'
  | 'awaiting-playoff'
  | 'team';

export type UpcomingVariant = 'far' | 'imminent';

export type HeroState =
  | { kind: 'live'; round: number; totalRounds: number }
  /**
   * Play has STOPPED but the tournament has NOT finished (suspended, delayed,
   * weather, holdup). The scores on the board are live scores, so this state
   * renders as live with a suspended marker — never FINAL, never a champion.
   * `reason` is null until the data carries one; no reason field exists today.
   */
  | { kind: 'suspended'; round: number; totalRounds: number; reason: string | null }
  | { kind: 'results'; variant: ResultsVariant; finishDate: string; meta: string }
  | { kind: 'upcoming'; variant: UpcomingVariant; countdown: string; meta: string };

export interface TickerRow {
  rank: string;
  shortName: string;
  score: number;
}

export interface TopTie {
  count: number;
  score: string;
}

// ---------- Changeover windows (single source of truth) -------------------

/**
 * How wide the COMPLETED bucket is fetched, in DAYS against `end_date`.
 * Deliberately LOOSER than the display cap below so the cap is enforceable in
 * the selection — a 14-day rule cannot be applied to a 3-day bucket
 * (MICRO_BRIEF_TOUR_SEASON_COMPLETE_WINDOW §1). Replaces the old
 * RESULTS_WINDOW_HOURS = 72, whose only consumer was that bucket.
 *
 * ONE CONSUMER: useTournamentsCache's completed-bucket query.
 */
export const COMPLETED_BUCKET_DAYS = 21;

/**
 * How long a tour with NO upcoming event keeps showing its last result in the
 * hero carousel. Past this the whole TOUR is omitted from the carousel
 * (useHeroCarouselData) and its picker row reads "Season complete".
 *
 * NOT a derivation guard: deriveHeroState still renders a closed event as
 * `results` at any age (BRIEF_TOUR_HERO_STALE_STATE §1).
 */
export const RESULTS_CAP_DAYS = 14;

/**
 * Handover window for a tour that DOES have an upcoming event: the result
 * stands for this many days, then the upcoming card takes the slot. A SECOND
 * constant on purpose — widening the bucket to COMPLETED_BUCKET_DAYS must not
 * make ordinary weeks show three-week-old results. Preserves the pre-brief
 * behaviour of RESULTS_WINDOW_HOURS = 72 (now expressed in days against
 * end_date).
 */
export const RESULTS_HANDOVER_DAYS = 3;



/**
 * Whole days between a tournament's `end_date` (a Postgres `date`) and today.
 * MEASURED IN DAYS AGAINST end_date — the same unit the completed bucket uses
 * — so the bucket and the cap can never drift the way hours-vs-date did.
 */
export function daysSinceEndDate(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  const end = Date.parse(`${endDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(end)) return null;
  const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.round((today - end) / 86_400_000);
}

/**
 * How far in advance the next event begins showing as UPCOMING. Used by
 * useTournamentsCache (bucket query window).
 */
export const UPCOMING_WINDOW_DAYS = 14;


// ---------- Score formatting -----------------------------------------------

const UNICODE_MINUS = '\u2212';

export function fmtScore(n: number | null | undefined): string {
  if (n == null) return 'E';
  if (n === 0) return 'E';
  if (n < 0) return `${UNICODE_MINUS}${Math.abs(n)}`;
  return `+${n}`;
}

/**
 * Broadcast round labels — positional, relative to total round count.
 * 4-round event: R1/R2 → "Round 1/2", R3 → "Moving Day", R4 → "Final Round".
 * 3-round event: R1 → "Round 1", R2 → "Moving Day", R3 → "Final Round".
 */
// UNUSED and English-only (hardcoded strings, no translation keys) — candidate for the orphan sweep.
export function roundLabel(round: number, totalRounds: number): string {
  if (!Number.isFinite(round) || round < 1) return 'Round 1';
  if (!Number.isFinite(totalRounds) || totalRounds < 2) return `Round ${round}`;
  if (round >= totalRounds) return 'Final Round';
  if (round === totalRounds - 1) return 'Moving Day';
  return `Round ${round}`;
}

/**
 * Round-level score-to-par colour for hero leaderboard contexts.
 * Wraps canonical `getScoreColor` from _shared/scoreColor for hero-family call sites.
 */
export function scoreColour(n: number, opts?: { resultsMode?: boolean }) {
  return getScoreColor(n, 'dark', opts?.resultsMode ? 'leader' : 'standard');
}

// ---------- Name shortening -------------------------------------------------

export function shortenName(fullName?: string | null): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const surname = surnameOf(fullName);
  const surnameParts = surname.split(/\s+/).length;
  const initials = parts.slice(0, -surnameParts).map((part) => part[0]).join('.');
  return initials ? `${initials}. ${surname}` : surname;
}

// ---------- Rank formatting -------------------------------------------------

export function formatRank(entry: { position?: number | null; position_tied?: boolean | null }): string {
  if (entry?.position == null) return '—';
  return entry.position_tied ? `T${entry.position}` : `${entry.position}`;
}

// ---------- Tie detection ---------------------------------------------------

export function detectTopTie(leaderboard: Array<Pick<BoardEntry, 'score'>>): TopTie | null {
  if (!leaderboard || leaderboard.length === 0) return null;
  const top = leaderboard[0];
  const topScore = top?.score;
  if (topScore == null) return null;
  const tied = leaderboard.filter(e => e?.score === topScore);
  if (tied.length < 2) return null;
  return { count: tied.length, score: fmtScore(topScore) };
}

// ---------- Countdown -------------------------------------------------------

export function formatCountdown(start: Date, now: Date = new Date()): string {
  const ms = Math.max(0, start.getTime() - now.getTime());
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ---------- State derivation ------------------------------------------------

interface DeriveOpts {
  teeTimesAvailable?: boolean;
}

/**
 * Statuses present in sr_tournaments that mean "has not been played yet".
 * `created` sits here explicitly (BRIEF_TOUR_HERO_STALE_STATE §4).
 */
export const UPCOMING_STATUSES = ['scheduled', 'created'];

/** Statuses meaning play has stopped mid-event. Mapped to `suspended`. */
export const SUSPENDED_STATUSES = ['suspended', 'delayed', 'weather', 'holdup'];
/** Statuses meaning regulation is over and a playoff is pending. */
export const PLAYOFF_STATUSES = ['playoff', 'inplayoff', 'in_playoff'];

/** Live or suspended: the board carries live scores (TODAY / THRU). */
export function isInPlayState(state: HeroState): state is Extract<HeroState, { kind: 'live' | 'suspended' }> {
  return state.kind === 'live' || state.kind === 'suspended';
}

/**
 * THE ONE CHAMPION GATE. A champion may be resolved ONLY when the event is
 * genuinely finished: `results`, and neither a pending playoff nor a
 * cancellation. Combined at every call site with an authoritative winner
 * (winner_id, or a closed team event's untied P1) — never by name or by a
 * position on a live board. Shared by the ChampionStrip (HybridHero), the
 * band's champion member ids (OverviewHero) and the pick trophy
 * (HeroBoardBand), so the three can never disagree.
 */
export function isChampionResolvable(state: HeroState): boolean {
  return state.kind === 'results' && state.variant !== 'awaiting-playoff' && state.variant !== 'cancelled';
}

export function deriveHeroState(
  tournament: HeroTournament,
  now: Date = new Date(),
  opts: DeriveOpts = {}
): HeroState {
  const status = (tournament.status || '').toLowerCase();
  const start = tournament.startDate ? new Date(tournament.startDate) : null;
  const end = tournament.endDate ? new Date(tournament.endDate) : null;
  const hoursUntilStart = start ? (start.getTime() - now.getTime()) / 3_600_000 : Infinity;


  // Cancelled — short circuit
  if (status === 'cancelled') {
    return {
      kind: 'results',
      variant: 'cancelled',
      finishDate: tournament.endDate || tournament.startDate || '',
      meta: 'No result',
    };
  }

  // Live — Sportradar is actively reporting in-progress play.
  if (status === 'inprogress' || status === 'in_progress') {
    return {
      kind: 'live',
      round: tournament.currentRound ?? 1,
      // INTERIM: no real num_rounds on HeroTournament yet. LPGA events are 54-hole
      // (3 rounds); everything else defaults to 4. Replace with tournament.num_rounds
      // when the cache exposes it.
      totalRounds: tournament.tourSlug === 'lpga' ? 3 : 4,
    };
  }

  // Suspended — play has stopped but the event has not finished. These scores
  // are LIVE scores, so this is its own kind and never reaches `results`.
  if (SUSPENDED_STATUSES.includes(status)) {
    return {
      kind: 'suspended',
      round: tournament.currentRound ?? 1,
      totalRounds: tournament.tourSlug === 'lpga' ? 3 : 4,
      reason: null,
    };
  }

  // Awaiting playoff — regulation complete, a playoff pending. ONLY playoff
  // statuses reach this variant; nothing weather-related may.
  if (PLAYOFF_STATUSES.includes(status)) {
    return {
      kind: 'results',
      variant: 'awaiting-playoff',
      finishDate: tournament.endDate || '',
      meta: 'PLAYOFF',
    };
  }

  // Results — closed/complete, AT ANY AGE.
  //
  // BRIEF_TOUR_HERO_STALE_STATE §1 — THE DEGRADE-TO-UPCOMING FALLBACK IS GONE.
  // This branch used to require the finish to be within RESULTS_WINDOW_HOURS
  // and otherwise fell through to the upcoming block, "so the badge/card body
  // never claim FINAL for a long-finished event that somehow ended up as the
  // chosen slide". The intent was sound and the fallback was worse than what it
  // prevented: it presented a finished event as one that had not happened and
  // ran a countdown on it. On 2026-08-26 the hero showed LIV Golf Indianapolis
  // — closed, finished 8/23 — as "TEES OFF AUG 20-23". A stale FINAL is merely
  // old; a stale TEES OFF is false.
  //
  // The trigger was a units mismatch, not bad data: useTournamentsCache bounds
  // the completed bucket with `end_date >= now - 72h`, which Postgres compares
  // date-truncated, so a Sunday finish stays in the bucket all of Wednesday,
  // while this derivation measured exact hours and flipped at hour 72.
  //
  // A CLOSED EVENT MAY RENDER AS RESULTS OR BE EXCLUDED. IT MAY NEVER RENDER AS
  // UPCOMING. Keeping an ancient result off the hero is the SELECTION's job
  // (useTournamentsCache bucket window + useHeroCarouselData priority); this
  // function's job is to describe the event it is given, truthfully. Do not
  // reinstate an age guard here — a third `stale` kind the hero declines to
  // render would be the only acceptable shape, never `upcoming`.
  if (status === 'closed' || status === 'complete' || status === 'completed') {
    return {
      kind: 'results',
      variant: 'standard',
      finishDate: tournament.endDate || '',
      meta: start && end
        ? `${formatMonthDay(start).toUpperCase()} \u2013 ${formatMonthDay(end).toUpperCase()}`
        : end ? formatMonthDay(end).toUpperCase() : '',
    };
  }

  // Upcoming — `scheduled` and `created`, HANDLED BY NAME (§4). `created` is
  // what Sportradar carries on the TOUR Championship, the Presidents Cup, the
  // FM Championship and The Ally Challenge; it previously reached this block by
  // falling through, which was correct only by accident. Anything unrecognised
  // still lands here — safe ONLY because closed/complete/completed return above
  // — and is flagged in dev so a new status is noticed rather than absorbed.
  if (status && !UPCOMING_STATUSES.includes(status) && import.meta.env.DEV) {
    console.warn('[deriveHeroState] unhandled tournament status, rendering as upcoming:', status);
  }

  const variant: UpcomingVariant =
    hoursUntilStart <= 48 && opts.teeTimesAvailable ? 'imminent' : 'far';


  return {
    kind: 'upcoming',
    variant,
    countdown: start ? formatCountdown(start, now) : '',
    meta: start ? formatMonthDay(start).toUpperCase() : '',
  };
}

// ---------- Top-10 ticker ---------------------------------------------------

/**
 * Rows for the hero wire strip. `offset` lets the strip CONTINUE a board that
 * already shows the leading positions (see HERO_BOARD_ROWS) so no player ever
 * appears in both.
 */
export function deriveTickerRows(leaderboard: BoardEntry[], offset = 0): TickerRow[] {
  if (!leaderboard) return [];
  return leaderboard.slice(offset, offset + 10).map(entry => {
    const player = entry.player;
    const last = player?.last_name;
    const full = player?.full_name || `${player?.first_name ?? ''} ${player?.last_name ?? ''}`.trim();
    return {
      rank: entry.position ? String(entry.position) : '—',
      shortName: last || shortenName(full),
      score: entry.score ?? 0,
    };
  });
}

// ---------- Today / thru helpers --------------------------------------------

/**
 * Best-effort "today" score for any leaderboard entry.
 * Uses the explicit `today` field, then falls back to the latest completed round.
 * Matches the BoardTable `todayFromEntry` semantics so the hero and the
 * full leaderboard read the same number.
 */
export function todayFromEntry(entry: BoardEntry | null | undefined): number | null {
  if (entry?.today != null) return entry.today;
  const rs = [entry?.round_1, entry?.round_2, entry?.round_3, entry?.round_4];
  const completed = rs.filter((r) => r != null);
  if (completed.length === 0) return null;
  return completed[completed.length - 1] ?? null;
}

// ---------- Trajectory sparkline helpers (Pass 3) --------------------------


/**
 * Classify a player's tournament arc for sparkline colour selection.
 *
 * - 'climbed': finished better than the trend predicted (late-tournament surge)
 * - 'faded':   finished worse than the trend predicted (Sunday collapse)
 * - 'steady':  finished close to the trend (no story)
 *
 * Method: compare final round to mean of prior rounds.
 * Threshold: ±1.5 strokes from trend.
 *
 * Input is TO-PAR per round (sr_leaderboards.round_N). Do not subtract par:
 * the old `r - par` conversion only gave right answers because the par term
 * cancels in `finalRound - priorAvg`.
 */
export function classifyTrajectory(
  rounds: number[],
): 'climbed' | 'steady' | 'faded' {
  if (rounds.length < 3) return 'steady';
  const rel = rounds;
  const n = rel.length;
  const finalRound = rel[n - 1];
  const priorRounds = rel.slice(0, n - 1);
  const priorAvg = priorRounds.reduce((a, b) => a + b, 0) / priorRounds.length;
  const delta = finalRound - priorAvg;
  if (delta <= -1.5) return 'climbed';
  if (delta >= 1.5) return 'faded';
  return 'steady';
}



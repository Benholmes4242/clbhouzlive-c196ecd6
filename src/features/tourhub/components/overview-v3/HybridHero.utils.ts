/**
 * HybridHero utilities — state derivation, score formatting, tie detection.
 * Per §3 + §7 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import { format } from 'date-fns';
import type { HeroTournament } from '../../hooks/useHeroCarouselData';
import { getScoreColor } from '../../_shared/scoreColor';

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
  | { kind: 'live'; round: number; totalRounds: number; thruLabel: string }
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
 * How long a finished tournament continues to show as the RESULTS card
 * before handing over to the next event's UPCOMING card. 72h covers the
 * Sun-finish → Wed-viewing rhythm. Used by both useTournamentsCache (bucket
 * query window) and deriveHeroState (visual-state guard).
 */
export const RESULTS_WINDOW_HOURS = 72;

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
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(p => p[0]).join('.');
  return `${initials}. ${last}`;
}

// ---------- Rank formatting -------------------------------------------------

export function formatRank(entry: { position?: number | null; position_tied?: boolean | null }): string {
  if (entry?.position == null) return '—';
  return entry.position_tied ? `T${entry.position}` : `${entry.position}`;
}

// ---------- Tie detection ---------------------------------------------------

export function detectTopTie(leaderboard: any[]): TopTie | null {
  if (!leaderboard || leaderboard.length === 0) return null;
  const top = leaderboard[0];
  const topScore = top?.score ?? top?.total;
  if (topScore == null) return null;
  const tied = leaderboard.filter(e => (e?.score ?? e?.total) === topScore);
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

export function deriveHeroState(
  tournament: HeroTournament,
  now: Date = new Date(),
  opts: DeriveOpts = {}
): HeroState {
  const status = (tournament.status || '').toLowerCase();
  const start = tournament.startDate ? new Date(tournament.startDate) : null;
  const end = tournament.endDate ? new Date(tournament.endDate) : null;
  const hoursSinceEnd = end ? (now.getTime() - end.getTime()) / 3_600_000 : null;
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

  // Live
  if (status === 'inprogress' || status === 'inplayoff' || status === 'delayed') {
    return {
      kind: 'live',
      round: tournament.currentRound ?? 1,
      // INTERIM: no real num_rounds on HeroTournament yet. LPGA events are 54-hole
      // (3 rounds); everything else defaults to 4. Replace with tournament.num_rounds
      // when the cache exposes it.
      totalRounds: tournament.tourSlug === 'lpga' ? 3 : 4,
      thruLabel: 'F THRU',
    };
  }

  // Results — closed/complete AND within RESULTS_WINDOW_HOURS of finish.
  // Stale completed events (>72h) degrade gracefully to upcoming so the
  // badge/card body never claim "FINAL" for a long-finished event that
  // somehow ended up as the chosen slide.
  if (status === 'closed' || status === 'complete' || status === 'completed') {
    const isStale = hoursSinceEnd != null && hoursSinceEnd > RESULTS_WINDOW_HOURS;
    if (!isStale) {
      return {
        kind: 'results',
        variant: 'standard',
        finishDate: tournament.endDate || '',
        meta: start && end
          ? `${format(start, 'MMM d').toUpperCase()} – ${format(end, 'MMM d').toUpperCase()}`
          : end ? format(end, 'MMM d').toUpperCase() : '',
      };
    }
    // fall through to upcoming
  }


  // Upcoming
  const variant: UpcomingVariant =
    hoursUntilStart <= 48 && opts.teeTimesAvailable ? 'imminent' : 'far';

  return {
    kind: 'upcoming',
    variant,
    countdown: start ? formatCountdown(start, now) : '',
    meta: start ? format(start, 'MMM d').toUpperCase() : '',
  };
}

// ---------- Top-10 ticker ---------------------------------------------------

export function deriveTickerRows(leaderboard: any[]): TickerRow[] {
  if (!leaderboard) return [];
  return leaderboard.slice(0, 10).map(entry => {
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

// ---------- Leaderboard slot allocation (tie-collapse) ---------------------

export type ChaserSlot =
  | { kind: 'solo'; entry: any }
  | { kind: 'tie'; rank: string; count: number; score: number; members: any[] };

/**
 * Threshold at which a tie group collapses into a single TiedChasersRow even
 * when it would technically fit as individual rows. Rationale: 3+ identical
 * scores stacked dominate the snapshot and crowd out field depth. Collapsing
 * frees slots to show positions further down the leaderboard. Groups of 1 or
 * 2 always render individually.
 */
const COLLAPSE_THRESHOLD = 3;

export function buildLeaderboardSlots(chasers: any[], maxSlots = 4): ChaserSlot[] {
  const slots: ChaserSlot[] = [];
  let i = 0;
  while (i < chasers.length && slots.length < maxSlots) {
    const scoreOf = (e: any) => (e?.score ?? e?.total ?? 0);
    const groupScore = scoreOf(chasers[i]);
    let j = i;
    while (j < chasers.length && scoreOf(chasers[j]) === groupScore) j++;
    const group = chasers.slice(i, j);
    const remaining = maxSlots - slots.length;
    const rank = chasers[i]?.position != null ? `T${chasers[i].position}` : 'T—';

    if (group.length >= COLLAPSE_THRESHOLD) {
      // 3+ tie: collapse, whether or not it fits.
      slots.push({ kind: 'tie', rank, count: group.length, score: groupScore, members: group });
    } else if (group.length <= remaining) {
      // 1 or 2 entries that fit: render individually.
      for (const entry of group) slots.push({ kind: 'solo', entry });
    } else if (group.length >= 2) {
      // 2-way that doesn't fit (edge case at slot boundary): collapse.
      slots.push({ kind: 'tie', rank, count: group.length, score: groupScore, members: group });
    } else {
      slots.push({ kind: 'solo', entry: group[0] });
    }
    i = j;
  }
  return slots;
}

// ---------- Trajectory sparkline helpers (Pass 3) --------------------------

/**
 * Extract clean round scores from a leaderboard entry.
 * Returns only completed rounds (non-null, > 0).
 */
export function extractRounds(entry: any): number[] {
  const r1 = entry?.round_1;
  const r2 = entry?.round_2;
  const r3 = entry?.round_3;
  const r4 = entry?.round_4;
  return [r1, r2, r3, r4].filter((v): v is number => typeof v === 'number' && v > 0);
}

/**
 * Classify a player's tournament arc for sparkline colour selection.
 *
 * - 'climbed': finished better than the trend predicted (late-tournament surge)
 * - 'faded':   finished worse than the trend predicted (Sunday collapse)
 * - 'steady':  finished close to the trend (no story)
 *
 * Method: compare final round to mean of prior rounds, both relative to par.
 * Threshold: ±1.5 strokes from trend.
 */
export function classifyTrajectory(
  rounds: number[],
  par: number
): 'climbed' | 'steady' | 'faded' {
  if (rounds.length < 3 || !par) return 'steady';
  const rel = rounds.map(r => r - par);
  const n = rel.length;
  const finalRound = rel[n - 1];
  const priorRounds = rel.slice(0, n - 1);
  const priorAvg = priorRounds.reduce((a, b) => a + b, 0) / priorRounds.length;
  const delta = finalRound - priorAvg;
  if (delta <= -1.5) return 'climbed';
  if (delta >= 1.5) return 'faded';
  return 'steady';
}



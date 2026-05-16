/**
 * HybridHero utilities — state derivation, score formatting, tie detection.
 * Per §3 + §7 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import { format } from 'date-fns';
import type { HeroTournament } from '../../hooks/useHeroCarouselData';

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

// ---------- Score formatting -----------------------------------------------

const UNICODE_MINUS = '\u2212';

export function fmtScore(n: number | null | undefined): string {
  if (n == null) return 'E';
  if (n === 0) return 'E';
  if (n < 0) return `${UNICODE_MINUS}${Math.abs(n)}`;
  return `+${n}`;
}

export function scoreColour(n: number, opts?: { resultsMode?: boolean }) {
  if (opts?.resultsMode) return '#0F172A';
  if (n < 0) return '#16A34A';
  if (n > 0) return '#F7931E';
  return '#0F172A';
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
  const ms = start.getTime() - now.getTime();
  const hours = ms / 3_600_000;
  if (hours <= 48) {
    return `STARTS ${format(start, 'EEE').toUpperCase()} ${format(start, 'h:mm a')}`;
  }
  const days = Math.max(1, Math.ceil(hours / 24));
  return `STARTS ${format(start, 'MMM d').toUpperCase()} · ${days} DAYS`;
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
      round: 1,
      totalRounds: 4,
      thruLabel: 'F THRU',
    };
  }

  // Results — within 24h of finish, or carousel-promoted (off-season fallback)
  if (status === 'closed' || status === 'complete' || status === 'completed') {
    return {
      kind: 'results',
      variant: 'standard',
      finishDate: tournament.endDate || '',
      meta: end ? `${format(end, 'MMM d').toUpperCase()}` : '',
    };
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

/** Derived delay is shared by the overview hero, leaders' group and weekly
 * rows only; it never replaces provider-suspended handling or tournament-page
 * state. An in-progress event is delayed only when its round is scheduled or
 * null, its earliest valid published tee is more than 60 minutes ago, and no
 * leaderboard row has today_round equal to that round with thru > 0.
 * A starter, any round-status change, or republished future tees ends it.
 * Callers own existing reads and clocks; this rule performs no reads.
 */
import { LIVE_STATUSES } from '@/utils/tournamentState';
import { useEffect, useState } from 'react';

export const DELAY_AFTER_MINUTES = 60;

export interface RoundDelayInput {
  status: string | null | undefined;
  currentRound: number | null | undefined;
  currentRoundStatus: string | null | undefined;
  firstTee: string | null | undefined;
  started: boolean;
  now: Date | number;
}

export function isRoundDelayed({ status, currentRound, currentRoundStatus, firstTee, started, now }: RoundDelayInput): boolean {
  if (!LIVE_STATUSES.includes((status ?? '').trim().toLowerCase())) return false;
  if (currentRound == null || !Number.isInteger(currentRound) || currentRound < 1 || started) return false;
  if (currentRoundStatus != null && currentRoundStatus.trim().toLowerCase() !== 'scheduled') return false;
  const tee = firstTee ? Date.parse(firstTee) : NaN;
  const clock = now instanceof Date ? now.getTime() : now;
  return Number.isFinite(tee) && Number.isFinite(clock) && clock - tee > DELAY_AFTER_MINUTES * 60_000;
}

/** Never mistake yesterday's stale thru or a score without a played hole for
 * a current-round starter; every consumer uses the same exact round match. */
export function roundHasStarter(rows: ReadonlyArray<{ today_round?: number | null; thru?: number | null }>, round: number | null | undefined): boolean {
  return round != null && rows.some(row => row.today_round === round && row.thru != null && Number.isFinite(row.thru) && row.thru > 0);
}

/** Prefer the caller's existing minute clock; standalone surfaces tick only
 * when one is not supplied, so crossing the boundary needs no read change. */
export function useRoundDelayClock(now?: Date): Date {
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    if (now != null) return;
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, [now]);
  return now ?? clock;
}
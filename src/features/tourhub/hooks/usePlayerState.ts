/**
 * usePlayerState — derive the editorial "state" of a player profile so the
 * hero can render context-appropriate narrative pills.
 *
 * Priority order (D7):
 *   1. Live      — has a row in sr_leaderboards for an inprogress tournament
 *   2. Recent    — most recent completed event ended within last 7 days AND
 *                  finishing position ≤ 10 OR position = 1
 *   3. In-form   — ≥ 3 completed events in last 12 months
 *   4. Inactive  — fallback. Surfaces last event date label.
 *
 * Live state subscribes to useLeaderboardRealtime so push updates from the
 * tournament-live-sync cron invalidate caches automatically.
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLeaderboardRealtime } from './useLeaderboardRealtime';
import { usePlayerResults } from './usePlayerResults';

export type PlayerState = 'live' | 'recent' | 'inform' | 'inactive';

export interface PlayerLiveData {
  tournamentId: string;
  tournamentName: string;
  currentRound: number | null;
  /** e.g. "-8 thru 14" or "-8 F" or just "-8" if no thru data */
  scoreText: string;
}

export interface PlayerRecentData {
  /** e.g. "T2 last week", "Won last week" */
  label: string;
  /** Tournament name (kept short by consumer if needed) */
  context?: string;
}

export interface PlayerInactiveData {
  /** e.g. "Sep 2024" */
  lastEventLabel: string;
}

export interface PlayerStateData {
  state: PlayerState;
  liveData?: PlayerLiveData;
  recentData?: PlayerRecentData;
  inactiveData?: PlayerInactiveData;
  /** Convenience: number of completed events in last 12 months. */
  eventsLast12mo: number;
}

interface LiveRow {
  tournament_id: string;
  position: number | null;
  score: number | null;
  thru: number | null;
  status: string | null;
  tournament: {
    name: string;
    status: string;
    current_round: number | null;
  } | null;
}

function formatScoreText(score: number | null, thru: number | null): string {
  const scorePart =
    score === null ? '—' : score === 0 ? 'E' : score > 0 ? `+${score}` : String(score);
  if (thru === null) return scorePart;
  if (thru >= 18) return `${scorePart} F`;
  return `${scorePart} thru ${thru}`;
}

function formatPositionShort(position: number | null): string {
  if (position === null) return '—';
  return `T${position}`.replace(/^T1$/, '1'); // "1" instead of "T1" for solo lead
}

/** Live tournament fetch + Realtime subscription. */
function useLivePlayerRow(playerId: string | undefined) {
  return useQuery({
    queryKey: ['tourhub', 'player-live', playerId],
    enabled: !!playerId,
    staleTime: 60 * 1000, // 60s — Realtime invalidates on push
    queryFn: async (): Promise<LiveRow | null> => {
      if (!playerId) return null;
      const { data, error } = await supabase
        .from('sr_leaderboards')
        .select(`
          tournament_id,
          position,
          score,
          thru,
          status,
          tournament:sr_tournaments!inner(name, status, current_round)
        `)
        .eq('player_id', playerId)
        .eq('tournament.status', 'inprogress')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[usePlayerState] live row error:', error);
        return null;
      }
      return (data as unknown as LiveRow) ?? null;
    },
  });
}

export function usePlayerState(playerId: string | undefined): PlayerStateData {
  const { data: liveRow } = useLivePlayerRow(playerId);
  // pull a generous window so we can derive Recent + In-form + Inactive from one source
  const { data: results } = usePlayerResults(playerId, 30);

  // Subscribe to Realtime for the live tournament so push updates invalidate.
  useLeaderboardRealtime(liveRow?.tournament_id ?? null);

  // Re-render every 60s so the "7 days ago" cutoff is fresh on long-lived sessions.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // ── 1. Live ────────────────────────────────────────────────────────────
  if (liveRow && liveRow.tournament) {
    return {
      state: 'live',
      liveData: {
        tournamentId: liveRow.tournament_id,
        tournamentName: liveRow.tournament.name,
        currentRound: liveRow.tournament.current_round,
        scoreText: formatScoreText(liveRow.score, liveRow.thru),
      },
      eventsLast12mo: 0, // not relevant in live state; consumer reads liveData
    };
  }

  // Build a list of completed events sorted by end_date desc (usePlayerResults
  // already orders by end_date desc post D19 fix).
  const completed = (results ?? []).filter((r) => {
    const s = r.status?.toUpperCase();
    // Keep WD/CUT/MC rows in the count (they're starts) but exclude when
    // computing "Recent" position-based wins.
    return !!r.tournament_end_date && s !== 'DQ';
  });

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;

  const eventsLast12mo = completed.filter(
    (r) => now - new Date(r.tournament_end_date).getTime() < twelveMonthsMs,
  ).length;

  // ── 2. Recent ──────────────────────────────────────────────────────────
  const mostRecent = completed[0];
  if (mostRecent) {
    const endedAt = new Date(mostRecent.tournament_end_date).getTime();
    const withinSevenDays = now - endedAt < sevenDaysMs;
    const status = mostRecent.status?.toUpperCase();
    const isStart = status !== 'WD' && status !== 'CUT' && status !== 'MC';
    const pos = mostRecent.position;
    const qualifies = isStart && pos !== null && (pos <= 10 || pos === 1);

    if (withinSevenDays && qualifies && pos !== null) {
      const label =
        pos === 1
          ? 'Won last week'
          : `${formatPositionShort(pos)} last week`;
      return {
        state: 'recent',
        recentData: {
          label,
          context: mostRecent.tournament_name,
        },
        eventsLast12mo,
      };
    }
  }

  // ── 3. In-form ─────────────────────────────────────────────────────────
  if (eventsLast12mo >= 3) {
    return { state: 'inform', eventsLast12mo };
  }

  // ── 4. Inactive ────────────────────────────────────────────────────────
  const lastEventLabel = mostRecent
    ? new Date(mostRecent.tournament_end_date).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return {
    state: 'inactive',
    inactiveData: { lastEventLabel },
    eventsLast12mo,
  };
}

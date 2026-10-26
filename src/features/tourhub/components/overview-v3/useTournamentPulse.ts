/**
 * useTournamentPulse — shared liveness/state hook for the live Overview.
 *
 * Status vocabularies mirror useOverviewData.ts:
 *   LIVE:      inprogress, in_progress, playoff, inplayoff, in_playoff,
 *              suspended, delayed, weather, holdup
 *   COMPLETED: closed, complete
 *
 * Rules:
 *   - live      = LIVE status AND today within [start_date, end_date], or a
 *                 PLAYOFF/SUSPENDED status whose end_date is within 3 days
 *   - completed = COMPLETED status OR end_date in the past
 *   - upcoming  = otherwise
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * EventState — shared vocabulary for the tour-event lifecycle. Rescued
 * from overview/data/useTourEventContext.ts ahead of the O5 nuke so
 * Tournament-aware overview consumers keep typing after that file is deleted.
 */
export type EventState = 'live' | 'upcoming' | 'completed';

export const LIVE_STATUSES = new Set([
  'inprogress', 'in_progress',
  'playoff', 'inplayoff', 'in_playoff',
  'suspended', 'delayed', 'weather', 'holdup',
]);

export const COMPLETED_STATUSES = new Set(['closed', 'complete', 'completed']);

export function endDateInPast(endISO: string | null, now = new Date()): boolean {
  if (!endISO) return false;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const end = new Date(endISO);
  end.setHours(23, 59, 59, 999);
  return end.getTime() < today.getTime();
}

interface PulseRow {
  id: string;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
}

function withinWindow(startISO: string | null, endISO: string | null, now = new Date()): boolean {
  if (!startISO || !endISO) return false;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = new Date(startISO);
  const end = new Date(endISO);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return today >= start && today <= end;
}


export type TournamentPulseState = 'live' | 'upcoming' | 'completed';

export interface TournamentPulse {
  state: TournamentPulseState;
  isLive: boolean;
}

/**
 * Deliberately NOT gated on event_type (BRIEF_NON_STROKE_GATE_2 §4): this hook
 * reads one tournament by id and returns a lifecycle state only — it asserts no
 * leader. The CONSUMER gates, not the hook: the tournament detail page checks
 * meta.event_type before mounting any leader-asserting section.
 */
export function useTournamentPulse(tournamentId: string | null | undefined): TournamentPulse {
  const id = tournamentId ?? undefined;

  const { data } = useQuery<PulseRow | null>({
    queryKey: ['tournament-pulse', id ?? null],
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('id, start_date, end_date, status')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as PulseRow | null;
    },
  });

  if (!id || !data) return { state: 'upcoming', isLive: false };

  const state = pulseStateFor(data);
  return { state, isLive: state === 'live' };
}

/** PLAYOFF/SUSPENDED statuses stay live for this many days after end_date. */
export const HELD_GRACE_DAYS = 3;
const HELD_STATUSES = new Set(['playoff', 'inplayoff', 'in_playoff', 'suspended', 'delayed', 'weather', 'holdup']);

/** end_date fell within the last `days` days (today excluded — that is the window). */
export function endedWithinDays(endISO: string | null, days: number, now = new Date()): boolean {
  if (!endISO) return false;
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const end = new Date(endISO); end.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - end.getTime()) / 86_400_000);
  return diff >= 1 && diff <= days;
}

/**
 * Pure lifecycle decision. 'inprogress' keeps the window rule; a PLAYOFF or
 * SUSPENDED status is also live for HELD_GRACE_DAYS after end_date (a Monday
 * playoff after a Sunday finish). A closed/complete status is completed.
 */
export function pulseStateFor(row: Pick<PulseRow, 'start_date' | 'end_date' | 'status'>, now = new Date()): TournamentPulseState {
  const statusLc = (row.status ?? '').toLowerCase();
  if (COMPLETED_STATUSES.has(statusLc)) return 'completed';
  if (LIVE_STATUSES.has(statusLc) && withinWindow(row.start_date, row.end_date, now)) return 'live';
  if (HELD_STATUSES.has(statusLc) && endedWithinDays(row.end_date, HELD_GRACE_DAYS, now)) return 'live';
  if (endDateInPast(row.end_date, now)) return 'completed';
  return 'upcoming';
}

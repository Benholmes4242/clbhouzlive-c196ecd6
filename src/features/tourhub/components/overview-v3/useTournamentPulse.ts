/**
 * useTournamentPulse — shared liveness/state hook for the live Overview.
 *
 * Status vocabularies mirror useOverviewData.ts:
 *   LIVE:      inprogress, in_progress, playoff, inplayoff, in_playoff,
 *              suspended, delayed, weather, holdup
 *   COMPLETED: closed, complete
 *
 * Rules:
 *   - live      = LIVE status AND today within [start_date, end_date]
 *   - completed = COMPLETED status OR end_date in the past
 *   - upcoming  = otherwise
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * EventState — shared vocabulary for the tour-event lifecycle. Rescued
 * from overview/data/useTourEventContext.ts ahead of the O5 nuke so
 * TIPicksCarousel keeps typing after that file is deleted.
 */
export type EventState = 'live' | 'upcoming' | 'completed';

export const LIVE_STATUSES = new Set([
  'inprogress', 'in_progress',
  'playoff', 'inplayoff', 'in_playoff',
  'suspended', 'delayed', 'weather', 'holdup',
]);

export const COMPLETED_STATUSES = new Set(['closed', 'complete', 'completed']);

export function endDateInPast(endISO: string | null): boolean {
  if (!endISO) return false;
  const today = new Date();
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

function withinWindow(startISO: string | null, endISO: string | null): boolean {
  if (!startISO || !endISO) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startISO);
  const end = new Date(endISO);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return today >= start && today <= end;
}

function endDateInPast(endISO: string | null): boolean {
  if (!endISO) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endISO);
  end.setHours(23, 59, 59, 999);
  return end.getTime() < today.getTime();
}

export type TournamentPulseState = 'live' | 'upcoming' | 'completed';

export interface TournamentPulse {
  state: TournamentPulseState;
  isLive: boolean;
}

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

  const statusLc = (data.status ?? '').toLowerCase();
  const isLive = LIVE_STATUSES.has(statusLc) && withinWindow(data.start_date, data.end_date);
  if (isLive) return { state: 'live', isLive: true };

  const isCompleted = COMPLETED_STATUSES.has(statusLc) || endDateInPast(data.end_date);
  if (isCompleted) return { state: 'completed', isLive: false };

  return { state: 'upcoming', isLive: false };
}

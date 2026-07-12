/**
 * OnTheCourseSlot — live-only adapter that binds the v4 OnTheCourse rail
 * to the live Overview page's tour selection.
 *
 * Liveness convention keyed on `sr_tournaments.status` — matches the exact
 * set useOverviewData.ts uses for its "live tournaments" query:
 *   'inprogress', 'in_progress',
 *   'playoff', 'inplayoff', 'in_playoff',
 *   'suspended', 'delayed', 'weather', 'holdup'
 * plus a today-within-[start_date, end_date] guard.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTourSelection } from '@/features/tourhub/context/TourSelectionContext';
import { OnTheCourse } from '@/features/tourhub/overview-v4/sections/OnTheCourse';

const LIVE_STATUSES = new Set([
  'inprogress', 'in_progress',
  'playoff', 'inplayoff', 'in_playoff',
  'suspended', 'delayed', 'weather', 'holdup',
]);

interface LivenessRow {
  id: string;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
}

function isWithinWindow(startISO: string | null, endISO: string | null): boolean {
  if (!startISO || !endISO) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startISO);
  const end = new Date(endISO);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return today >= start && today <= end;
}

export function OnTheCourseSlot() {
  const { selectedTournamentId } = useTourSelection();
  const tournamentId = selectedTournamentId ?? undefined;

  const { data } = useQuery<LivenessRow | null>({
    queryKey: ['on-the-course-slot', 'liveness', tournamentId ?? null],
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!tournamentId) return null;
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('id, start_date, end_date, status')
        .eq('id', tournamentId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as LivenessRow | null;
    },
  });

  if (!tournamentId) return null;
  if (!data) return null;

  const statusLc = (data.status ?? '').toLowerCase();
  const isLive =
    LIVE_STATUSES.has(statusLc) &&
    isWithinWindow(data.start_date, data.end_date);

  if (!isLive) return null;

  return <OnTheCourse tournamentId={tournamentId} live={isLive} />;
}

export default OnTheCourseSlot;

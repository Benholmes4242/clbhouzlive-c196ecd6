import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { WeekFacts } from './weekFactsRules';

/**
 * The ONE read of public.get_tournament_week_facts, shared by overview and
 * tournament pages. Completed callers read the selected event; upcoming
 * history explicitly reads only its resolved prior edition. Null facts keep
 * each caller's existing board/list fallback.
 * The generated types do not include the function yet, hence the cast (same
 * bound pattern as useFeaturedRound).
 */
export function useTournamentWeekFacts(tournamentId: string | null | undefined, enabled: boolean) {
  return useQuery<WeekFacts | null>({
    queryKey: ['tournament-week-facts', tournamentId ?? null],
    enabled: enabled && !!tournamentId,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: WeekFacts | null; error: { message?: string } | null }>).call(
        supabase,
        'get_tournament_week_facts',
        { p_tournament_id: tournamentId as string },
      );
      if (error) {
        console.error('[weekFacts] rpc failed', error.message);
        return null;
      }
      return data ?? null;
    },
  });
}

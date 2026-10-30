/** Earliest posted WHS year uses the same connection/population and settled
 * three-state contract as useMemberRoundTotal. No fallback or inferred year:
 * disabled queries are loading until fetched; failed reads discard stale data. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWhsConnection } from '@/lib/whs/hooks';

export interface MemberFirstRoundYear {
  year: number | null;
  state: 'ok' | 'loading' | 'error';
}

export function useMemberFirstRoundYear(userId: string | undefined): MemberFirstRoundYear {
  const { data: connection, isFetched: connectionFetched, isError: connectionError } = useWhsConnection(userId);
  const connectionId = connection?.id;
  const { data: year, isFetched, isError } = useQuery({
    queryKey: ['profile', 'first-round-year', connectionId ?? ''],
    enabled: !!connectionId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!connectionId) return null;
      const { data, error } = await supabase.from('whs_scores')
        .select('play_date').eq('connection_id', connectionId)
        .order('play_date', { ascending: true }).limit(1);
      if (error) throw error;
      const date = data?.[0]?.play_date;
      if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return null;
      const timestamp = Date.parse(date);
      return Number.isFinite(timestamp) ? Number(date.slice(0, 4)) : null;
    },
  });
  if (!userId) return { year: null, state: 'loading' };
  if (connectionError || isError) return { year: null, state: 'error' };
  if (!connectionFetched) return { year: null, state: 'loading' };
  if (!connectionId) return { year: null, state: 'ok' };
  if (!isFetched) return { year: null, state: 'loading' };
  return { year: year ?? null, state: 'ok' };
}
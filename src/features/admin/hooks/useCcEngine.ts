import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Engine figures belong solely to the admin RPC; a window change retains the
 * prior payload while fetching, but consumers suppress it if the read fails. */
export interface CcEngine {
  window_days: number;
  golfers: { current: number; previous: number; weekly: [number, number, number, number, number, number, number, number] };
  invites: { sent: number; joined: number };
  connect: { median_hours: number | null; n: number; prev_median_hours: number | null; prev_n: number; weekly: [number | null, number | null, number | null, number | null, number | null, number | null, number | null, number | null] };
  first_reaction: { median_hours: number | null; n: number; within_24h: number; eligible: number; weekly: [number | null, number | null, number | null, number | null, number | null, number | null, number | null, number | null] };
  notifications: { enabled: number; members: number };
  computed_at: string;
}
export function useCcEngine(days: 7 | 28 | 90) {
  const qc = useQueryClient();
  useEffect(() => {
    const handler = () => qc.invalidateQueries({ queryKey: ['admin', 'cc-engine'] });
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [qc]);
  return useQuery({
    queryKey: ['admin', 'cc-engine', days], staleTime: 60_000,
    placeholderData: previous => previous,
    queryFn: async (): Promise<CcEngine> => {
      const p_tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data, error } = await supabase.rpc('get_admin_cc_engine' as never, { p_tz, p_days: days } as never);
      if (error) throw error;
      if (!data) throw new Error('get_admin_cc_engine returned no payload');
      return data as unknown as CcEngine;
    },
  });
}

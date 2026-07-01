import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SuspensionDetails = {
  suspended: boolean;
  suspended_until: string | null;
  reason: string | null;
  permanent: boolean;
  suspended_at: string | null;
};

export type SuspensionState =
  | { status: 'loading'; suspension: null }
  | { status: 'ok'; suspension: null }
  | { status: 'suspended'; suspension: SuspensionDetails };

/**
 * FAIL-OPEN suspension gate hook.
 *
 * Rules of the road:
 *  - Any error / network failure / null result => 'ok' (never block).
 *  - Only an explicit suspended === true (and suspended_until not in the past)
 *    resolves to 'suspended'.
 *  - Short staleTime so lifts / expiries are picked up on next nav or focus.
 *  - Do NOT poll aggressively.
 */
export function useSuspensionStatus(userId: string | undefined): SuspensionState {
  const enabled = !!userId;

  const query = useQuery({
    queryKey: ['suspension-status', userId ?? 'anon'],
    enabled,
    staleTime: 45_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
    queryFn: async (): Promise<SuspensionDetails | null> => {
      try {
        const { data, error } = await supabase.rpc('get_my_suspension_status');
        if (error) {
          console.warn('[useSuspensionStatus] RPC error, failing open:', error);
          return null;
        }
        // RPC returns a set; supabase-js gives us an array of rows.
        const row = Array.isArray(data) ? data[0] : (data as any);
        if (!row) return null;
        return {
          suspended: !!row.suspended,
          suspended_until: row.suspended_until ?? null,
          reason: row.reason ?? null,
          permanent: !!row.permanent,
          suspended_at: row.suspended_at ?? null,
        };
      } catch (e) {
        console.warn('[useSuspensionStatus] threw, failing open:', e);
        return null;
      }
    },
  });

  if (!enabled) return { status: 'ok', suspension: null };
  if (query.isLoading && !query.data) return { status: 'loading', suspension: null };

  const s = query.data;
  if (!s || !s.suspended) return { status: 'ok', suspension: null };

  // Belt-and-braces: if suspended_until is in the past, treat as ok.
  if (s.suspended_until) {
    const untilMs = new Date(s.suspended_until).getTime();
    if (Number.isFinite(untilMs) && untilMs <= Date.now()) {
      return { status: 'ok', suspension: null };
    }
  }

  return { status: 'suspended', suspension: s };
}

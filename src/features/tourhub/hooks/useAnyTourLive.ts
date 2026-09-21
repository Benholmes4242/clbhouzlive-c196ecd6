/**
 * useAnyTourLive — is play actually happening on ANY tour the app tracks?
 *
 * Drives the one live state in the bottom nav (Trophy + TOUR label go green).
 * Green is a STATE, never an identity: this hook is the only thing allowed to
 * turn it on.
 *
 * PREDICATE (round-level, with a tournament-level fallback per row):
 *   sr_tournaments.status = 'inprogress'
 *   AND ( current_round_status IN ('live','inprogress')   -- a round is running
 *         OR current_round_status IS NULL )               -- round detail not synced yet
 *
 * Why both halves:
 *   - `current_round_status` alone is NOT trustworthy: closed tournaments are
 *     left holding 'live' (stale rows exist in prod), so the status gate is
 *     mandatory.
 *   - When a round has finished for the day the row reads
 *     status='inprogress' + current_round_status='complete', so the icon
 *     correctly goes dark overnight between rounds.
 *   - NULL round status means the round detail has not been written yet; that
 *     degrades to the sanctioned fallback (tournament in progress) rather than
 *     hiding a genuinely live event.
 *
 * FAIL CLOSED: loading, error, empty, or any missing data => false.
 *
 * CACHE: queryKey root 'nav-live-tour' is deliberately NOT under any
 * persister allowlist prefix (note: 'tour' IS allowlisted — hence the prefix
 * choice), so this value can never survive an app restart.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAnyTourLive(): boolean {
  const { data } = useQuery<boolean>({
    queryKey: ['nav-live-tour'],
    staleTime: 60_000,              // 1 min
    gcTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,    // 5 min while foregrounded
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sr_tournaments')
        .select('id, current_round_status')
        .eq('status', 'inprogress')
        .limit(50);
      if (error) return false;      // fail closed
      const rows = data ?? [];
      return rows.some((r: { current_round_status: string | null }) => {
        const s = (r.current_round_status ?? '').toLowerCase();
        return s === '' || s === 'live' || s === 'inprogress';
      });
    },
  });

  return data === true;             // undefined / error => ink-dim
}

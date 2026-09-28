import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

/**
 * BRIEF_SCORES_FEATURED_ROUND §3 — the one round above the Scores feed.
 *
 * get_featured_round returns 0 or 1 rows. NO ROW = NULL = THE SECTION IS
 * ABSENT; quiet weeks are expected. Errors also resolve to null (logged) so a
 * missing function never paints a frame.
 *
 * The key carries viewer, scope AND geography, exactly as exploreKeys.stream,
 * or a scope change would serve another scope's hero from cache.
 */
export type FeaturedRound = Database['public']['Functions']['get_featured_round']['Returns'][number];

export function useFeaturedRound(
  viewerId: string | undefined,
  scope: string,
  geography?: { clubId?: string | null; county?: string | null; country?: string | null },
) {
  return useQuery<FeaturedRound | null>({
    queryKey: [
      'explore-featured-round',
      viewerId ?? 'anon',
      scope,
      geography?.clubId ?? null,
      geography?.county ?? null,
      geography?.country ?? null,
    ],
    enabled: !!viewerId,
    staleTime: 5 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      /* BOUND: supabase.rpc reads `this.rest`; see useExploreStream. */
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: FeaturedRound[] | null; error: { message?: string } | null }>).call(
        supabase,
        'get_featured_round',
        {
          p_viewer: viewerId as string,
          p_scope: scope,
          p_club_id: geography?.clubId ?? null,
          p_county: geography?.county ?? null,
          p_country: geography?.country ?? null,
          p_days: 7,
        },
      );
      if (error) {
        console.error('[featuredRound] rpc failed', error.message);
        return null;
      }
      return data?.[0] ?? null;
    },
  });
}

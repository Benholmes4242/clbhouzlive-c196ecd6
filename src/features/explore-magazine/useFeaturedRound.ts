import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

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
/**
 * LOCAL ON PURPOSE: the generated get_featured_round block types every column as
 * non-nullable (display_name: string), but most can genuinely be null. Do not
 * replace this with the generated type.
 */
export interface FeaturedRound { whs_score_id: string; user_id: string;
  display_name: string | null; photo_url: string | null; course_id: string;
  course_name: string | null; image_url: string | null; play_date: string;
  gross: number | null; course_par: number | null; to_par: number | null;
  stableford: number | null; birdies: number | null; eagles: number | null;
  albatrosses: number | null; holes_in_one: number | null;
  clean_card: boolean | null; net_score: number | null;
  vs_hcp: number | null; tier: number; reason: string;
  joint_name: string | null; joint_count: number | null;
  /** Home feed hero only (reason birdie_run): longest run of birdies. */
  birdie_run?: number | null; }

/**
 * RULING (Round scores §3) — the featured hero's net facts come from
 * public.gam_round_net: ONE single-row read keyed on whs_score_id, the same
 * FN1 source useCommentsContext uses (get_featured_round returns net_score
 * but no course handicap). No row = the round cannot be netted: the hero
 * draws no to-par figure, no trace and no NET cell — never a gross
 * substitute. No RPC or migration change.
 */
export function useFeaturedRoundNet(whsScoreId: string | null | undefined) {
  return useQuery<{ netScore: number | null; courseHandicap: number | null }>({
    queryKey: ['featured-round-net', whsScoreId ?? null],
    enabled: !!whsScoreId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      const { data } = await supabase
        .from('gam_round_net' as never)
        .select('net_score, course_handicap')
        .eq('whs_score_id', whsScoreId as string)
        .maybeSingle();
      const row = data as { net_score?: unknown; course_handicap?: unknown } | null;
      return {
        netScore: typeof row?.net_score === 'number' ? row.net_score : null,
        courseHandicap: typeof row?.course_handicap === 'number' ? row.course_handicap : null,
      };
    },
  });
}

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

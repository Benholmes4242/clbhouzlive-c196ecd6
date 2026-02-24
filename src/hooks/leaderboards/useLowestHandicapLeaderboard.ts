import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { LowestHandicapEntry, LeaderboardScope } from '@/types/leaderboards';

const PAGE_SIZE = 50;

interface UseLowestHandicapLeaderboardOptions {
  scope?: LeaderboardScope;
  clubId?: string | null;
  country?: string | null;
  enabled?: boolean;
}

export function useLowestHandicapLeaderboard(options: UseLowestHandicapLeaderboardOptions = {}) {
  const { user } = useSupabaseSession();
  const { 
    scope = 'global', 
    clubId = null,
    country = null,
    enabled = true 
  } = options;

  return useInfiniteQuery({
    queryKey: ['lowest-handicap-leaderboard', scope, clubId, country, user?.id],
    queryFn: async ({ pageParam = 0 }): Promise<{ entries: LowestHandicapEntry[] }> => {
      const { data, error } = await supabase.rpc('get_lowest_handicap_leaderboard', {
        p_scope: scope,
        p_club_id: clubId ?? null,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
        p_current_user_id: user?.id ?? null,
        p_country: scope === 'country' ? country : null,
      });

      if (error) {
        console.error('Error fetching lowest handicap leaderboard:', error);
        throw error;
      }

      return { entries: (data ?? []) as unknown as LowestHandicapEntry[] };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.entries.length < PAGE_SIZE) return undefined;
      const totalLoaded = allPages.reduce((sum, p) => sum + p.entries.length, 0);
      return totalLoaded;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    placeholderData: keepPreviousData,
  });
}

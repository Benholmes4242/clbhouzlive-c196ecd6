import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CountryByMemberCountRow {
  country: string;
  member_count: number;
}

const PAGE_SIZE = 50;

/**
 * Returns countries ranked by Clbhouz member count.
 * Backed by `get_global_country_breakdown` (RPC).
 */
export function useCountriesByMemberCount({ enabled = true }: { enabled?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: ['countries-by-member-count'],
    queryFn: async ({ pageParam = 0 }): Promise<{ entries: CountryByMemberCountRow[] }> => {
      const { data, error } = await (supabase.rpc as any)('get_global_country_breakdown', {
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      });
      if (error) throw error;
      return {
        entries: ((data ?? []) as Array<{ country: string; member_count: number }>).map(r => ({
          country: r.country,
          member_count: Number(r.member_count) || 0,
        })),
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.entries.length < PAGE_SIZE) return undefined;
      return allPages.reduce((sum, p) => sum + p.entries.length, 0);
    },
    enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes
    placeholderData: keepPreviousData,
  });
}

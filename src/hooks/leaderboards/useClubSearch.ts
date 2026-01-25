import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClubSearchResult } from '@/types/leaderboards';

interface UseClubSearchOptions {
  searchTerm: string;
  limit?: number;
  enabled?: boolean;
}

export function useClubSearch(options: UseClubSearchOptions) {
  const { searchTerm, limit = 10, enabled = true } = options;

  return useQuery({
    queryKey: ['club-search', searchTerm, limit],
    queryFn: async (): Promise<ClubSearchResult[]> => {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      // Use type assertion as the RPC types haven't synced yet
      const { data, error } = await (supabase.rpc as any)('search_golf_clubs', {
        p_search_term: searchTerm,
        p_limit: limit,
      });

      if (error) {
        console.error('Error searching clubs:', error);
        throw error;
      }

      return (data ?? []) as unknown as ClubSearchResult[];
    },
    enabled: enabled && searchTerm.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

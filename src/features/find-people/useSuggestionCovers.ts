/** One viewer-scoped cover read per surface; the server owns source/privacy
 * selection. Request order follows display order; cache identity is sorted. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const EMPTY = new Map<string, string>();

export function useSuggestionCoversQuery(personIds: string[], businessIds: string[]) {
  const { user } = useSupabaseSession();
  const viewerId = user?.id ?? null;
  const people = personIds.slice(0, 100);
  const businesses = businessIds.slice(0, 100);
  const ids = [...people.map(id => `p:${id}`), ...businesses.map(id => `b:${id}`)].sort();
  const query = useQuery({
    queryKey: ['suggestion-covers', viewerId, ids],
    enabled: !!viewerId && user?.is_anonymous !== true && ids.length > 0,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_suggestion_covers', {
        p_user_ids: people, p_business_ids: businesses,
      });
      if (error) throw error;
      const covers = new Map<string, string>();
      for (const row of data ?? []) {
        if (row.cover_url && (row.kind === 'person' || row.kind === 'business')) {
          covers.set(`${row.kind === 'person' ? 'p' : 'b'}:${row.id}`, row.cover_url);
        }
      }
      return covers;
    },
  });
  return { covers: query.data ?? EMPTY, settled: !(!!viewerId && user?.is_anonymous !== true && ids.length > 0) || query.isFetched || query.isError };
}

/** Compatibility reader: existing surfaces retain the map-only contract. */
export function useSuggestionCovers(personIds: string[], businessIds: string[]): Map<string, string> {
  return useSuggestionCoversQuery(personIds, businessIds).covers;
}
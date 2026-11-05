/** FW1: the server owns qualification/rank; this in-memory query holds order for
 * the entire app session (including remounts). `watch` is not disk-persisted.
 * Guest visibility is unchanged from WatchLead. Engagement patches never reorder.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { WatchLeadRow } from './useWatchLead';

export type WatchFeaturedRow = Omit<WatchLeadRow, 'reason'> & {
  reason: string;
  rank: number;
  score: number;
  is_liked_by_me?: boolean;
};

export function useWatchFeatured(userId: string | undefined) {
  return useQuery({
    queryKey: ['watch', 'featured', userId ?? 'guest'],
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_watch_featured', { p_limit: 8 });
      if (error) throw error;
      return (data ?? []) as unknown as WatchFeaturedRow[];
    },
  });
}
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WatchHubCounts {
  clip_count: number;
  video_count: number;
}

export function useWatchHubCounts() {
  return useQuery<WatchHubCounts>({
    queryKey: ['watch-hub-counts'],
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as { rpc: (fn: string) => Promise<{ data: unknown; error: unknown }> }).rpc('get_watch_hub_counts');
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useWatchHubCounts]', error);
        }
        return { clip_count: 0, video_count: 0 };
      }
      const row = Array.isArray(data) ? (data[0] as Partial<WatchHubCounts> | undefined) : null;
      return {
        clip_count: row?.clip_count ?? 0,
        video_count: row?.video_count ?? 0,
      };
    },
  });
}

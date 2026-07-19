import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HubRpcRow } from '../utils/toFeedPost';

type RpcClient = { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };

export function useHubLongFormVideos(userId: string | undefined) {
  return useQuery({
    queryKey: ['hub-long-form-videos', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as RpcClient).rpc('get_long_form_videos', {
        p_user_id: userId,
        p_mode: 'latest',
        p_page_size: 10,
      });
      if (error) {
        if (import.meta.env.DEV) console.error(error);
        return [] as HubRpcRow[];
      }
      return (data ?? []) as HubRpcRow[];
    },
  });
}

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
      const { data, error } = await (supabase as unknown as RpcClient).rpc('get_long_form_videos_v2', {
        p_user_id: userId,
        p_mode: 'latest',
        p_page_size: 10,
      });
      /* ERRORED IS NOT EMPTY (BRIEF_EXPLORE_MAGAZINE PHASE D §5b). This read used
         to swallow the error and return [], so a FAILED long-form rail and a
         genuinely empty one were the same render - a failure that looks like a
         correct empty state is invisible forever. It now throws; the row shows
         its failed state and offers the read again. */
      if (error) throw error;
      return (data ?? []) as HubRpcRow[];
    },
    retry: 1,
  });
}

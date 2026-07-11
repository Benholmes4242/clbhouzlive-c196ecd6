import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useHubQuickClips(userId: string | undefined) {
  return useQuery({
    queryKey: ['hub-quick-clips', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_watch_shorts', {
        p_user_id: userId,
        p_mode: 'trending',
        p_page_size: 12,
      });
      if (error) {
        if (import.meta.env.DEV) console.error(error);
        return [] as any[];
      }
      return (data ?? []) as any[];
    },
  });
}

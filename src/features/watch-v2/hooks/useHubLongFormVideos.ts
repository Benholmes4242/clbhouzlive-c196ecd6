import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useHubLongFormVideos(userId: string | undefined) {
  return useQuery({
    queryKey: ['hub-long-form-videos', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_long_form_videos', {
        p_user_id: userId,
        p_mode: 'latest',
        p_page_size: 10,
      });
      if (error) {
        if (import.meta.env.DEV) console.error(error);
        return [] as any[];
      }
      return (data ?? []) as any[];
    },
  });
}

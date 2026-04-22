import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WatchOfTheWeek {
  post_id: string;
  user_id: string;
  course_id: string | null;
  course_name: string | null;
  caption: string | null;
  thumbnail_url: string | null;
  hls_url: string | null;
  duration_seconds: number | null;
  format: 'clip' | 'video';
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  why_ai: string | null;
}

export function useWatchOfTheWeek() {
  return useQuery({
    queryKey: ['watch-of-the-week'],
    queryFn: async (): Promise<WatchOfTheWeek | null> => {
      const { data, error } = await supabase.rpc('get_watch_of_the_week' as any);
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useWatchOfTheWeek] error:', error);
          throw error;
        }
        return null;
      }
      const row = Array.isArray(data) ? (data as any[])[0] : (data as any);
      return row ?? null;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
  });
}

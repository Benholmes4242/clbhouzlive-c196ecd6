import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MostLovedRow {
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
  engagement_score: number;
}

export function useMostLovedThisWeek(limit = 12) {
  return useQuery({
    queryKey: ['watch-most-loved-this-week', limit],
    queryFn: async (): Promise<MostLovedRow[]> => {
      const { data, error } = await supabase.rpc('get_watch_most_loved_this_week' as any, {
        p_limit: limit,
      });
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useMostLovedThisWeek] error:', error);
          throw error;
        }
        return [];
      }
      return (data as MostLovedRow[] | null) ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VideoOfTheWeek {
  post_id: string;
  user_id: string;
  course_id: string | null;
  course_name: string | null;
  caption: string | null;
  thumbnail_url: string | null;
  hls_url: string | null;
  duration_seconds: number | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  why_ai: string | null;
}

/**
 * Fetches the editorial Video of the Week (long-form, >90s).
 * Uses get_video_of_the_week RPC (Phase 1) — no parameters, single weekly pick.
 * Returns null when no qualifying video exists for the current week.
 */
export function useVideoOfTheWeek() {
  return useQuery({
    queryKey: ['video-of-the-week'],
    queryFn: async (): Promise<VideoOfTheWeek | null> => {
      const { data, error } = await supabase.rpc('get_video_of_the_week' as any);
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useVideoOfTheWeek] error:', error);
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

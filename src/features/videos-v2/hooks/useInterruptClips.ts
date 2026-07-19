/**
 * useInterruptClips — single shared trending-clips pool for every clips
 * interrupt shelf on /watch/videos. Not infinite; one page of 9.
 * All shelves on the page slice this pool by shelfIndex so we make ONE
 * network call regardless of how many shelves are interleaved.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type RpcClient } from '@/features/watch-v2/hooks/useHubMixedGrid';

export interface InterruptClipRow {
  post_id: string;
  post_content: string | null;
  post_created_at: string | null;
  poster_url: string | null;
  duration_seconds: number | null;
  creator_username: string | null;
  creator_display_name: string | null;
  creator_avatar_url: string | null;
  review_course_name: string | null;
  course_name: string | null;
  [key: string]: unknown;
}

export function useInterruptClips(userId: string | undefined) {
  return useQuery<InterruptClipRow[]>({
    queryKey: ['videos-v2-interrupt-clips', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as unknown as RpcClient).rpc('get_watch_shorts', {
        p_user_id: userId,
        p_mode: 'trending',
        p_page_size: 9,
      });
      if (error) {
        if (import.meta.env.DEV) console.error('[useInterruptClips]', error);
        return [];
      }
      return (data ?? []) as InterruptClipRow[];
    },
  });
}

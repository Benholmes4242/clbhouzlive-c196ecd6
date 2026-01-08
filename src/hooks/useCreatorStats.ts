import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Duration threshold for long-form vs shorts
const LONG_FORM_THRESHOLD = 240; // 4 minutes

export interface CreatorStats {
  followerCount: number;
  totalViews: number;
  videoCount: number;
  shortCount: number;
  joinedAt?: string;
}

/**
 * Fetches stats for a creator:
 * - Follower count
 * - Total views across all videos
 * - Long-form video count (≥4 min)
 * - Shorts count (<4 min)
 */
export function useCreatorStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['creator-stats-v1', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    queryFn: async (): Promise<CreatorStats> => {
      if (!userId) throw new Error('No userId provided');

      console.log('[useCreatorStats] 📊 Fetching stats for:', userId);

      // Get follower count
      const { count: followerCount, error: followerError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (followerError) {
        console.error('[useCreatorStats] Follower count error:', followerError);
      }

      // Get long-form video count (≥4 min)
      const { count: videoCount, error: videoError } = await supabase
        .from('posts')
        .select('*, post_media!inner(*)', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('post_media.media_type', 'video')
        .gte('post_media.duration_seconds', LONG_FORM_THRESHOLD)
        .eq('visibility', 'anyone');

      if (videoError) {
        console.error('[useCreatorStats] Video count error:', videoError);
      }

      // Get shorts count (<4 min)
      const { count: shortCount, error: shortError } = await supabase
        .from('posts')
        .select('*, post_media!inner(*)', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('post_media.media_type', 'video')
        .lt('post_media.duration_seconds', LONG_FORM_THRESHOLD)
        .gt('post_media.duration_seconds', 0)
        .eq('visibility', 'anyone');

      if (shortError) {
        console.error('[useCreatorStats] Short count error:', shortError);
      }

      // Get total views across all videos
      const { data: viewsData, error: viewsError } = await supabase
        .from('posts')
        .select(`
          post_views(count)
        `)
        .eq('user_id', userId)
        .eq('visibility', 'anyone');

      if (viewsError) {
        console.error('[useCreatorStats] Views error:', viewsError);
      }

      const totalViews = (viewsData || []).reduce((sum, post: any) => {
        return sum + (post.post_views?.[0]?.count || 0);
      }, 0);

      // Get user joined date
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('created_at')
        .eq('id', userId)
        .single();

      const stats: CreatorStats = {
        followerCount: followerCount || 0,
        totalViews,
        videoCount: videoCount || 0,
        shortCount: shortCount || 0,
        joinedAt: profileData?.created_at,
      };

      console.log('[useCreatorStats] ✅ Stats loaded:', stats);

      return stats;
    },
  });
}

export default useCreatorStats;

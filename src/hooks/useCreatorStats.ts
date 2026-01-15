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
 * Fetches stats for a creator PAGE (not user):
 * - Follower count (from creator_follows)
 * - Total views across all videos
 * - Long-form video count (≥4 min)
 * - Shorts count (<4 min)
 * 
 * Uses actor_type='creator' and actor_id=creatorPageId to query creator-specific content
 */
export function useCreatorStats(creatorPageId: string | undefined) {
  return useQuery({
    queryKey: ['creator-stats-v2', creatorPageId],
    enabled: !!creatorPageId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    queryFn: async (): Promise<CreatorStats> => {
      if (!creatorPageId) throw new Error('No creatorPageId provided');

      console.log('[useCreatorStats] 📊 Fetching stats for creatorPageId:', creatorPageId);

      // Get follower count from creator_follows table
      const followerResult = await supabase
        .from('creator_follows')
        .select('*', { count: 'exact', head: true })
        .eq('creator_page_id', creatorPageId);

      if (followerResult.error) {
        console.log('[useCreatorStats] Follower count error:', followerResult.error);
      }

      // Get all posts for this creator page using actor_type and actor_id
      const postsResult = await supabase
        .from('posts')
        .select('id')
        .eq('actor_type', 'creator')
        .eq('actor_id', creatorPageId)
        .eq('visibility', 'anyone')
        .eq('status', 'published');

      if (postsResult.error) {
        console.log('[useCreatorStats] Posts query error:', postsResult.error);
      }

      const postIds = postsResult.data?.map(p => p.id) || [];
      
      // Count videos and shorts from post_media
      let videoCount = 0;
      let shortCount = 0;
      
      if (postIds.length > 0) {
        // Get media durations for these posts
        const mediaResult = await supabase
          .from('post_media')
          .select('post_id, duration_seconds')
          .in('post_id', postIds)
          .eq('media_type', 'video');
        
        if (mediaResult.data) {
          for (const media of mediaResult.data) {
            const duration = media.duration_seconds;
            if (duration !== null && duration !== undefined) {
              if (duration >= LONG_FORM_THRESHOLD) {
                videoCount++;
              } else if (duration > 0) {
                shortCount++;
              }
            }
          }
        }
      }

      // Get total views from creator_daily_metrics
      let totalViews = 0;
      const metricsResult = await supabase
        .from('creator_daily_metrics')
        .select('impressions')
        .eq('creator_page_id', creatorPageId);

      if (metricsResult.error) {
        console.log('[useCreatorStats] Views error:', metricsResult.error);
      } else if (metricsResult.data && metricsResult.data.length > 0) {
        totalViews = metricsResult.data.reduce((sum, m) => sum + (m.impressions || 0), 0);
      }

      // Get creator page created date
      const pageResult = await supabase
        .from('creator_pages')
        .select('created_at')
        .eq('id', creatorPageId)
        .single();

      const stats: CreatorStats = {
        followerCount: followerResult.count || 0,
        totalViews,
        videoCount,
        shortCount,
        joinedAt: pageResult.data?.created_at,
      };

      console.log('[useCreatorStats] ✅ Stats loaded:', stats);

      return stats;
    },
  });
}

export default useCreatorStats;

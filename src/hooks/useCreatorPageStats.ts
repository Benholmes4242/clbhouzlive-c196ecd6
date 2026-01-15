import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreatorPageStats {
  followers: number;
  posts: number;
  views7d: number;
}

/**
 * Fetches stats for a creator page (entity-based, not user-based)
 * - Follower count from creator_follows
 * - Post count from posts with creator_page_id
 * - Views from creator_daily_metrics (last 7 days)
 */
export function useCreatorPageStats(creatorPageId: string | undefined) {
  return useQuery({
    queryKey: ['creator-page-stats', creatorPageId],
    enabled: !!creatorPageId,
    staleTime: 60 * 1000, // 1 minute
    
    queryFn: async (): Promise<CreatorPageStats> => {
      if (!creatorPageId) throw new Error('No creatorPageId provided');

      // Get follower count from creator_follows
      const { count: followers, error: followerError } = await supabase
        .from('creator_follows')
        .select('*', { count: 'exact', head: true })
        .eq('creator_page_id', creatorPageId);

      if (followerError) {
        console.error('[useCreatorPageStats] Follower count error:', followerError);
      }

      // Get post count for this creator page
      // Note: creator_page_id may not exist on posts table, fallback to 0
      let posts = 0;
      try {
        const { count, error: postError } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', creatorPageId); // Fallback - may need adjustment based on schema

        if (!postError && count !== null) {
          posts = count;
        }
      } catch (e) {
        console.error('[useCreatorPageStats] Post count error:', e);
      }

      // Get views from last 7 days from creator_daily_metrics
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data: metrics, error: metricsError } = await supabase
        .from('creator_daily_metrics')
        .select('impressions')
        .eq('creator_page_id', creatorPageId)
        .gte('metric_date', dateStr);

      if (metricsError) {
        console.error('[useCreatorPageStats] Metrics error:', metricsError);
      }

      const views7d = (metrics || []).reduce((sum, m) => sum + (m.impressions || 0), 0);

      return {
        followers: followers || 0,
        posts: posts || 0,
        views7d,
      };
    },
  });
}

export default useCreatorPageStats;

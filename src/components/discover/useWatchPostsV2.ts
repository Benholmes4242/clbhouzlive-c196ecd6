import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedMediaItem } from '@/components/shared/grid/types';
import { activityPostToUnified } from '@/components/shared/grid/adapters';

const PAGE_SIZE = 24;

interface WatchPostsPage {
  items: UnifiedMediaItem[];
  nextCursor: number;
  hasMore: boolean;
}

/**
 * Fetches posts for Watch page with hybrid recency+engagement scoring:
 * - All users (excludes soft-deleted posts)
 * - Videos only
 * - Under 4 minutes (240 seconds)
 * - Both portrait and landscape orientations
 * - Public visibility
 * - Cursor-based pagination
 * - Hybrid scoring: recent content stays visible, popular content rises
 */
export function useWatchPostsV2() {
  const query = useInfiniteQuery({
    queryKey: ['watch-posts', 'v2'],
    enabled: true,
    initialPageParam: 0,
    
    queryFn: async ({ pageParam = 0 }): Promise<WatchPostsPage> => {
      const startRange = pageParam as number;
      const endRange = startRange + PAGE_SIZE - 1;

      // Fetch posts with video media under 4 minutes + engagement metrics
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          actor_type,
          actor_id,
          course_id,
          badges,
          categories,
          source_review_id,
          post_media (
            id,
            media_type,
            media_url,
            poster_url,
            aspect_ratio,
            width,
            height,
            duration_seconds,
            filter_id,
            studio_edits
          ),
          post_tags (
            id,
            tagged_entity_id,
            start_index,
            end_index,
            taggable_entities (
              id,
              entity_type,
              entity_id,
              name,
              username
            )
          ),
          course:golf_courses!course_id (
            id,
            name,
            country,
            sub_country,
            region
          ),
          post_likes(count),
          post_views(count),
          post_comments(count)
        `)
        .eq('visibility', 'anyone')
        .eq('post_media.media_type', 'video')
        .lte('post_media.duration_seconds', 240)
        .order('created_at', { ascending: false })
        .range(startRange, endRange);

      if (error) throw error;


      // Get unique user IDs - use user_id (always references user_profiles)
      // actor_id may reference business accounts which don't exist in user_profiles
      const userIds = [...new Set(
        postsData?.map(p => p.user_id).filter(Boolean)
      )] as string[];

      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? []);

      // Attach user data to posts using user_id
      const postsWithUsers = (postsData || []).map(post => ({
        ...post,
        user: profileMap.get(post.user_id || '') || null
      }));

      // Filter posts that have valid media
      const activityPosts = postsWithUsers.filter(
        (post) => post.post_media && post.post_media.length > 0
      );

      // Apply hybrid scoring: recency + engagement
      const now = Date.now();
      const postsWithScores = activityPosts.map(post => {
        // Calculate age in hours
        const ageMs = now - new Date(post.created_at).getTime();
        const ageHours = ageMs / (1000 * 60 * 60);
        
        // Get engagement metrics (with fallbacks)
        const likes = (post as any).post_likes?.[0]?.count || 0;
        const views = (post as any).post_views?.[0]?.count || 0;
        const comments = (post as any).post_comments?.[0]?.count || 0;
        
        // CONSERVATIVE hybrid score
        // Recency: 1000 base - (2 points per hour) → fresh content has high score
        // Engagement: Small boost for popular videos
        const recencyScore = Math.max(0, 1000 - (ageHours * 2));
        const engagementScore = (likes * 3) + (views / 20) + (comments * 5);
        
        const totalScore = recencyScore + engagementScore;
        
        return {
          ...post,
          _hybridScore: totalScore,
        };
      });

      // Sort by hybrid score (highest first)
      const sortedPosts = postsWithScores.sort((a, b) => b._hybridScore - a._hybridScore);

      if (import.meta.env.DEV && sortedPosts.length > 0) {
        console.log('[useWatchPostsV2] Hybrid scoring applied:', {
          totalPosts: sortedPosts.length,
          sampleScores: sortedPosts.slice(0, 3).map(p => ({
            postId: p.id.slice(0, 8),
            score: p._hybridScore.toFixed(0),
          }))
        });
      }

      // Convert to UnifiedMediaItem using existing adapter
      const items = sortedPosts
        .map((post, index) => activityPostToUnified(post as any, startRange + index))
        .filter((item): item is UnifiedMediaItem => item !== null);

      const hasMore = (postsData?.length ?? 0) === PAGE_SIZE;
      const nextCursor = hasMore ? endRange + 1 : startRange;

      return { items, nextCursor, hasMore };
    },

    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
  });

  // Flatten pages into single array
  const allItems = query.data?.pages.flatMap((page) => page.items) ?? [];
  const hasMore = query.hasNextPage ?? false;

  return {
    items: allItems,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasMore,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

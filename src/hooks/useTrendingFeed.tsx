import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserPosts } from '@/hooks/useUserPosts';
import { useOptimisticPosts } from '@/hooks/useOptimisticPosts';
import { useExternalVideos } from '@/hooks/useExternalVideos';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { buildVisibilityFilter } from '@/utils/visibilityFilter';

export const useTrendingFeed = () => {
  const { user } = useSupabaseSession();
  const { posts: userPosts, loading: userPostsLoading, refetch: refetchUserPosts } = useUserPosts();
  const { optimisticPosts } = useOptimisticPosts();
  const { videos: externalVideos, loading: externalVideosLoading } = useExternalVideos();

  // Get posts from followed users and friends with optimized query
  const { data: followedUsersPosts = [], isLoading: followedPostsLoading, refetch: refetchFollowedPosts } = useQuery({
    queryKey: ['followedUsersPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get connected user IDs efficiently with increased limits
      const [followsResponse, friendsResponse] = await Promise.all([
        supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .limit(10), // Slightly increased for better content
        supabase
          .from('user_friends')
          .select('user_id, friend_id')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .limit(10) // Slightly increased for better content
      ]);

      const followedUserIds = followsResponse.data?.map(f => f.following_id) || [];
      const friendUserIds = friendsResponse.data?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];
      
      const allConnectedUserIds = [...new Set([...followedUserIds, ...friendUserIds])];

      if (allConnectedUserIds.length === 0) return [];

      // Single optimized query with all required data and filter for media posts only
      const visibilityFilter = buildVisibilityFilter(user.id);
      
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          actor_type,
          badges,
          post_media!inner(id, media_type, media_url, filter_id, studio_edits)
        `)
        .in('user_id', allConnectedUserIds)
        .or('actor_type.eq.personal,actor_type.is.null') // Exclude business posts
        .or(visibilityFilter) // Apply visibility filter
        .eq('status', 'published') // Only show published posts
        .order('created_at', { ascending: false })
        .limit(6); // Optimized limit for performance

      if (postsError) {
        console.error('Error fetching followed posts:', postsError);
        return [];
      }

      if (!posts || posts.length === 0) return [];

      // Get profiles in single query
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', [...new Set(posts.map(p => p.user_id))]);

      // Format posts efficiently with cached lookups
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return posts.map(post => {
        const userProfile = profileMap.get(post.user_id);
        
        return {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          badges: post.badges || [],
          user: {
            id: post.user_id,
            display_name: userProfile?.display_name || null,
            username: userProfile?.username || null,
            profile_photo_url: userProfile?.profile_photo_url || null
          },
          post_media: post.post_media?.map((m: any) => ({
            id: m.id,
            media_type: m.media_type as 'image' | 'video',
            media_url: m.media_url,
            filter_id: m.filter_id,
            studio_edits: m.studio_edits
          })) || [],
          post_tags: [] // Disabled for performance
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 600000, // 10 minutes cache for better performance
    refetchInterval: false,
    gcTime: 900000, // 15 minutes cache retention
  });

  // Legacy event listeners removed - PostEventsBridge handles cache invalidation globally

  return {
    userPosts,
    userPostsLoading,
    followedUsersPosts,
    followedPostsLoading,
    optimisticPosts,
    externalVideos,
    externalVideosLoading,
    refetchUserPosts,
    refetchFollowedPosts,
  };
};
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserPosts } from '@/hooks/useUserPosts';
import { useOptimisticPosts } from '@/hooks/useOptimisticPosts';
import { useExternalVideos } from '@/hooks/useExternalVideos';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

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

      // Get connected user IDs efficiently with reduced limits for better performance
      const [followsResponse, friendsResponse] = await Promise.all([
        supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .limit(5), // Reduced for better performance
        supabase
          .from('user_friends')
          .select('user_id, friend_id')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .limit(5) // Reduced for better performance
      ]);

      const followedUserIds = followsResponse.data?.map(f => f.following_id) || [];
      const friendUserIds = friendsResponse.data?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];
      
      const allConnectedUserIds = [...new Set([...followedUserIds, ...friendUserIds])];

      if (allConnectedUserIds.length === 0) return [];

      // Single optimized query with minimal data selection
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media!inner(id, media_type, media_url)
        `)
        .in('user_id', allConnectedUserIds)
        .order('created_at', { ascending: false })
        .limit(4); // Further reduced for better performance

      if (postsError) {
        console.error('Error fetching followed posts:', postsError);
        return [];
      }

      if (!posts || posts.length === 0) return [];

      // Get profiles in single query - only necessary fields
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
          user: {
            id: post.user_id,
            display_name: userProfile?.display_name || null,
            username: userProfile?.username || null,
            profile_photo_url: userProfile?.profile_photo_url || null
          },
          post_media: post.post_media?.map((m: any) => ({
            id: m.id,
            media_type: m.media_type as 'image' | 'video',
            media_url: m.media_url
          })) || [],
          post_tags: [] // Disabled for performance
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes cache for faster updates
    refetchInterval: false,
    gcTime: 600000, // 10 minutes cache retention
  });

  // Listen for feed refresh events
  useEffect(() => {
    const handleFeedRefresh = () => {
      refetchUserPosts();
      refetchFollowedPosts();
    };

    const handlePostCompleted = () => {
      // Force immediate refetch
      setTimeout(() => {
        refetchUserPosts();
        refetchFollowedPosts();
      }, 1000); // Small delay to ensure database is updated
    };

    const handlePostDeleted = () => {
      refetchUserPosts();
      refetchFollowedPosts();
    };

    // Listen for various feed refresh events
    window.addEventListener('refreshFeed', handleFeedRefresh);
    window.addEventListener('postUploadCompleted', handlePostCompleted);
    window.addEventListener('postDeleted', handlePostDeleted);

    return () => {
      window.removeEventListener('refreshFeed', handleFeedRefresh);
      window.removeEventListener('postUploadCompleted', handlePostCompleted);
      window.removeEventListener('postDeleted', handlePostDeleted);
    };
  }, [refetchUserPosts, refetchFollowedPosts]);

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
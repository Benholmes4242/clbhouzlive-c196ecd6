import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserPosts } from '@/hooks/useUserPosts';
import { useOptimisticPosts } from '@/hooks/useOptimisticPosts';
import { useExternalVideos } from '@/hooks/useExternalVideos';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const PAGE_SIZE = 12;

export const useTrendingFeed = () => {
  const { user } = useSupabaseSession();
  const { posts: userPosts, loading: userPostsLoading, refetch: refetchUserPosts } = useUserPosts();
  const { optimisticPosts } = useOptimisticPosts();
  const { videos: externalVideos, loading: externalVideosLoading } = useExternalVideos();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allFollowedPosts, setAllFollowedPosts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Get posts from followed users and friends with pagination
  const { data: followedPostsData, isLoading: followedPostsLoading, refetch: refetchFollowedPosts } = useQuery({
    queryKey: ['followedUsersPosts', user?.id, currentPage],
    queryFn: async () => {
      if (!user?.id) return { posts: [], hasMore: false };

      // Get connected user IDs efficiently
      const [followsResponse, friendsResponse] = await Promise.all([
        supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .limit(100),
        supabase
          .from('user_friends')
          .select('user_id, friend_id')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .limit(100)
      ]);

      const followedUserIds = followsResponse.data?.map(f => f.following_id) || [];
      const friendUserIds = friendsResponse.data?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];
      
      const allConnectedUserIds = [...new Set([...followedUserIds, ...friendUserIds])];

      if (allConnectedUserIds.length === 0) return { posts: [], hasMore: false };

      // Calculate offset for pagination
      const offset = (currentPage - 1) * PAGE_SIZE;

      // Single optimized query with pagination
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
        .range(offset, offset + PAGE_SIZE - 1);

      if (postsError) {
        console.error('Error fetching followed posts:', postsError);
        return { posts: [], hasMore: false };
      }

      if (!posts || posts.length === 0) return { posts: [], hasMore: false };

      // Get profiles in single query
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', [...new Set(posts.map(p => p.user_id))]);

      // Format posts efficiently with cached lookups
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const formattedPosts = posts.map(post => {
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

      return { 
        posts: formattedPosts, 
        hasMore: formattedPosts.length === PAGE_SIZE 
      };
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes cache
    refetchInterval: false,
    gcTime: 600000, // 10 minutes cache retention
  });

  // Update accumulated posts when new data comes in
  useEffect(() => {
    if (followedPostsData?.posts) {
      if (currentPage === 1) {
        // First page - replace all posts
        setAllFollowedPosts(followedPostsData.posts);
      } else {
        // Subsequent pages - append to existing posts
        setAllFollowedPosts(prev => [...prev, ...followedPostsData.posts]);
      }
      setHasMore(followedPostsData.hasMore);
      setIsLoadingMore(false);
    }
  }, [followedPostsData, currentPage]);

  // Load more posts function
  const loadMorePosts = useCallback(async () => {
    if (!hasMore || isLoadingMore || followedPostsLoading) return;
    
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  }, [hasMore, isLoadingMore, followedPostsLoading]);

  // Reset pagination when user changes
  useEffect(() => {
    setCurrentPage(1);
    setAllFollowedPosts([]);
    setHasMore(true);
    setIsLoadingMore(false);
  }, [user?.id]);

  // Listen for feed refresh events
  useEffect(() => {
    const handleFeedRefresh = () => {
      setCurrentPage(1);
      setAllFollowedPosts([]);
      setHasMore(true);
      setIsLoadingMore(false);
      refetchUserPosts();
      refetchFollowedPosts();
    };

    const handlePostCompleted = () => {
      // Force immediate refetch
      setTimeout(() => {
        handleFeedRefresh();
      }, 1000);
    };

    const handlePostDeleted = () => {
      handleFeedRefresh();
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
    followedUsersPosts: allFollowedPosts,
    followedPostsLoading: followedPostsLoading && currentPage === 1,
    optimisticPosts,
    externalVideos,
    externalVideosLoading,
    refetchUserPosts,
    refetchFollowedPosts,
    // Infinite scroll props
    hasMore,
    isLoadingMore,
    loadMorePosts,
  };
};

import React, { useEffect } from 'react';
import PostCard from './feed/PostCard';
import UserPost from './posts/UserPost';
import OptimisticPostCard from './posts/OptimisticPostCard';
import LoadingSkeleton from './feed/LoadingSkeleton';

import { useUserPosts } from '@/hooks/useUserPosts';
import { useOptimisticPosts } from '@/hooks/useOptimisticPosts';
import { useExternalVideos } from '@/hooks/useExternalVideos';
import { sortContentByTime } from '@/utils/contentSorting';
import { VideoPost, UserPostWithType } from './feed/types';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TrendingFeed = () => {
  const { user } = useSupabaseSession();
  const { posts: userPosts, loading: userPostsLoading, refetch: refetchUserPosts } = useUserPosts();
  const { optimisticPosts } = useOptimisticPosts();
  const { videos: externalVideos, loading: externalVideosLoading } = useExternalVideos();

  // Get posts from followed users and friends with optimized query
  const { data: followedUsersPosts = [], isLoading: followedPostsLoading, refetch: refetchFollowedPosts } = useQuery({
    queryKey: ['followedUsersPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get connected user IDs efficiently
      const [followsResponse, friendsResponse] = await Promise.all([
        supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .limit(5), // Reduced for performance
        supabase
          .from('user_friends')
          .select('user_id, friend_id')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .limit(5) // Reduced for performance
      ]);

      const followedUserIds = followsResponse.data?.map(f => f.following_id) || [];
      const friendUserIds = friendsResponse.data?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];
      
      const allConnectedUserIds = [...new Set([...followedUserIds, ...friendUserIds])];

      if (allConnectedUserIds.length === 0) return [];

      // Single optimized query with all required data
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .in('user_id', allConnectedUserIds)
        .order('created_at', { ascending: false })
        .limit(3); // Reduced limit for performance

      if (postsError) {
        console.error('Error fetching followed posts:', postsError);
        return [];
      }

      if (!posts || posts.length === 0) return [];

      // Get profiles and media in parallel
      const [profilesResponse, mediaResponse] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, display_name, username, profile_photo_url')
          .in('id', posts.map(p => p.user_id)),
        supabase
          .from('post_media')
          .select('id, media_type, media_url, post_id')
          .in('post_id', posts.map(p => p.id))
      ]);

      const profiles = profilesResponse.data || [];
      const postMedia = mediaResponse.data || [];

      // Format posts efficiently
      return posts.map(post => {
        const userProfile = profiles.find(profile => profile.id === post.user_id);
        const media = postMedia.filter(m => m.post_id === post.id);

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
          post_media: media.map(m => ({
            id: m.id,
            media_type: m.media_type as 'image' | 'video',
            media_url: m.media_url
          })),
          post_tags: [] // Disabled for performance
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes cache
    refetchInterval: false,
    gcTime: 300000,
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

  // Show skeleton loading only for initial load
  if ((userPostsLoading || followedPostsLoading) && userPosts.length === 0 && followedUsersPosts.length === 0) {
    return <LoadingSkeleton />;
  }

  // Filter out example friend videos with early return for performance
  const realFriendVideos = externalVideos.length > 0 ? externalVideos.filter(video => 
    video.type === 'friend' &&
    !video.user.username?.includes('mikej_golf') && 
    !video.user.username?.includes('sarahgolf') &&
    !video.user.name?.includes('Mike Johnson') &&
    !video.user.name?.includes('Sarah Chen')
  ) : [];

  // Convert posts to the correct type and include ALL user posts (including current user's)
  const allUserPosts: UserPostWithType[] = [
    ...userPosts.map(post => ({ ...post, type: 'user_post' as const })),
    ...followedUsersPosts.map(post => ({ ...post, type: 'user_post' as const }))
  ];

  // Deduplicate posts by ID to prevent showing the same post twice
  const uniqueUserPosts = allUserPosts.reduce((acc, post) => {
    if (!acc.find(existingPost => existingPost.id === post.id)) {
      acc.push(post);
    }
    return acc;
  }, [] as UserPostWithType[]);

  // Removed excessive logging for performance

  // Combine all content
  const allContent: (VideoPost | UserPostWithType)[] = [
    ...uniqueUserPosts,
    ...realFriendVideos
  ];

  const sortedContent = sortContentByTime(allContent);

  if (sortedContent.length === 0 && optimisticPosts.length === 0) {
    return (
      <div className="space-y-6 pb-20">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No posts from friends or followed accounts yet.</p>
          <p className="text-muted-foreground text-sm mt-2">
            Follow users or add friends to see their posts here!
          </p>
        </div>
      </div>
    );
  }

  return (
      <div className="index-feed space-y-6 pb-20">
        {/* Show optimistic posts first */}
        {optimisticPosts.map((optimisticPost) => (
          <OptimisticPostCard 
            key={optimisticPost.id} 
            post={optimisticPost}
            onRetry={() => {
              // Handle retry logic here if needed
            }}
          />
        ))}
        
        {/* Show actual posts */}
        {sortedContent.map((item) => (
          item.type === 'user_post' ? (
            <UserPost 
              key={item.id} 
              post={item} 
              source="index"
              onPostUpdated={() => {
                refetchUserPosts();
                refetchFollowedPosts();
              }}
              onPostDeleted={() => {
                refetchUserPosts();
                refetchFollowedPosts();
              }}
            />
          ) : (
            <PostCard 
              key={item.id} 
              post={{
                ...item,
                golfClubTags: item.golfClubTags || []
              }} 
            />
          )
        ))}
      </div>
  );
};

export default TrendingFeed;


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

  // Get posts from followed users and friends with reduced data
  const { data: followedUsersPosts = [], isLoading: followedPostsLoading, refetch: refetchFollowedPosts } = useQuery({
    queryKey: ['followedUsersPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get users that current user follows (limit to reduce query complexity)
      const { data: follows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .limit(10); // Reduced for performance

      // Get users that are friends (accepted status, limit for performance)
      const { data: friends } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .limit(10); // Reduced for performance

      // Combine followed users and friends
      const followedUserIds = follows?.map(f => f.following_id) || [];
      const friendUserIds = friends?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];
      
      const allConnectedUserIds = [...new Set([...followedUserIds, ...friendUserIds])];

      if (allConnectedUserIds.length === 0) return [];

      // Get posts from these users (reduced limit for faster loading)
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
        .limit(5); // Reduced for faster mobile loading

      if (postsError) {
        console.error('Error fetching followed posts:', postsError);
        return [];
      }

      if (!posts) return [];

      // Get user profiles and media in parallel for faster loading
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

      const profiles = profilesResponse.data;
      const postMedia = mediaResponse.data;

      // Simplified tags fetch for performance
      let postTags = [];
      const { data: tags } = await supabase
        .from('post_tags')
        .select(`
          post_id,
          tagged_entity_id,
          taggable_entities!inner (
            id,
            entity_type,
            entity_id,
            name
          )
        `)
        .in('post_id', posts.map(p => p.id))
        .limit(20); // Reduced for better performance

      postTags = tags || [];

      // Format posts with related data
      const formattedPosts = posts.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const media = postMedia?.filter(m => m.post_id === post.id) || [];
        const tags = postTags?.filter(t => t.post_id === post.id).map((tag: any) => ({
          id: tag.taggable_entities?.id || tag.tagged_entity_id,
          entity_type: tag.taggable_entities?.entity_type || 'user',
          entity_id: tag.taggable_entities?.entity_id || tag.tagged_entity_id,
          name: tag.taggable_entities?.name || 'Unknown',
          username: tag.taggable_entities?.username || null
        })) || [];

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
          post_tags: tags
        };
      });

      return formattedPosts;
    },
    enabled: !!user?.id,
    staleTime: 600000, // Consider data fresh for 10 minutes
    refetchInterval: false, // Disable auto-refetch for performance
    gcTime: 300000, // Cache for 5 minutes after component unmount
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

  if (userPostsLoading || externalVideosLoading || followedPostsLoading) {
    return <LoadingSkeleton />;
  }

  // Filter out example friend videos
  const realFriendVideos = externalVideos.filter(video => 
    video.type === 'friend' &&
    video.user.username !== '@mikej_golf' && 
    video.user.username !== '@sarahgolf' &&
    !video.user.name.includes('Mike Johnson') &&
    !video.user.name.includes('Sarah Chen') &&
    !video.content.description.includes('Hole in one at my local course') &&
    !video.content.description.includes('Working on my swing at the driving range')
  );

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
      <div className="space-y-6 pb-20">
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


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

  // Get posts from followed users and friends
  const { data: followedUsersPosts = [], isLoading: followedPostsLoading, refetch: refetchFollowedPosts } = useQuery({
    queryKey: ['followedUsersPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('Fetching followed users posts for user:', user.id);

      // Get users that current user follows
      const { data: follows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      // Get users that are friends (accepted status)
      const { data: friends } = await supabase
        .from('user_friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      // Combine followed users and friends
      const followedUserIds = follows?.map(f => f.following_id) || [];
      const friendUserIds = friends?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];
      
      const allConnectedUserIds = [...new Set([...followedUserIds, ...friendUserIds])];
      console.log('Connected user IDs:', allConnectedUserIds);

      if (allConnectedUserIds.length === 0) return [];

      // Get posts from these users
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *
        `)
        .in('user_id', allConnectedUserIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) {
        console.error('Error fetching followed posts:', postsError);
        return [];
      }

      if (!posts) return [];
      console.log('Fetched', posts.length, 'posts from followed users');

      // Get user profiles for all post authors
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', posts.map(p => p.user_id));

      // Get post media for all posts
      const { data: postMedia } = await supabase
        .from('post_media')
        .select('*')
        .in('post_id', posts.map(p => p.id));

      // Get post tags with proper entity information
      let postTags = [];
      try {
        const { data: tags, error: tagsError } = await supabase
          .from('post_tags')
          .select(`
            post_id,
            tagged_entity_id,
            taggable_entities (
              id,
              entity_type,
              entity_id,
              name,
              username
            )
          `)
          .in('post_id', posts.map(p => p.id));

        if (tagsError) {
          console.error('Error fetching post tags:', tagsError);
        } else {
          postTags = tags || [];
          console.log('Followed posts - Fetched post tags:', postTags.length);
        }
      } catch (error) {
        console.error('Failed to fetch post tags:', error);
      }

      // Format posts with related data
      const formattedPosts = posts.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const media = postMedia?.filter(m => m.post_id === post.id) || [];
        const tags = postTags?.filter(t => t.post_id === post.id).map((tag: any) => {
          // Handle the case where taggable_entities might be null
          if (!tag.taggable_entities) {
            console.warn('Missing taggable_entities for tag:', tag.tagged_entity_id);
            return null;
          }
          return {
            id: tag.taggable_entities.id,
            entity_type: tag.taggable_entities.entity_type,
            entity_id: tag.taggable_entities.entity_id,
            name: tag.taggable_entities.name,
            username: tag.taggable_entities.username
          };
        }).filter(Boolean) || []; // Filter out null entries

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

      console.log('Formatted followed posts:', formattedPosts.length);
      return formattedPosts;
    },
    enabled: !!user?.id,
    staleTime: 60000, // Consider data fresh for 1 minute
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Listen for feed refresh events
  useEffect(() => {
    const handleFeedRefresh = () => {
      console.log('Feed refresh triggered - refetching all data');
      refetchUserPosts();
      refetchFollowedPosts();
    };

    const handlePostCompleted = () => {
      console.log('Post upload completed, refreshing feed immediately');
      // Force immediate refetch
      setTimeout(() => {
        refetchUserPosts();
        refetchFollowedPosts();
      }, 1000); // Small delay to ensure database is updated
    };

    const handlePostDeleted = () => {
      console.log('Post deleted, refreshing feed');
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

  // Log post counts for debugging
  console.log('TrendingFeed - Final post counts:', {
    userPosts: userPosts.length,
    followedPosts: followedUsersPosts.length,
    uniquePosts: uniqueUserPosts.length,
    optimisticPosts: optimisticPosts.length,
    totalToShow: uniqueUserPosts.length + optimisticPosts.length
  });

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
            console.log('Retry upload for:', optimisticPost.id);
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
              console.log('Post updated, refreshing feeds');
              refetchUserPosts();
              refetchFollowedPosts();
            }}
            onPostDeleted={() => {
              console.log('Post deleted, refreshing feeds');
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

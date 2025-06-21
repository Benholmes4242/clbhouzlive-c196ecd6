
import React from 'react';
import PostCard from './feed/PostCard';
import UserPost from './posts/UserPost';
import LoadingSkeleton from './feed/LoadingSkeleton';
import { useUserPosts } from '@/hooks/useUserPosts';
import { useExternalVideos } from '@/hooks/useExternalVideos';
import { sortContentByTime } from '@/utils/contentSorting';
import { VideoPost, UserPostWithType } from './feed/types';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TrendingFeed = () => {
  const { user } = useSupabaseSession();
  const { posts: userPosts, loading: userPostsLoading, refetch: refetchUserPosts } = useUserPosts();
  const { videos: externalVideos, loading: externalVideosLoading } = useExternalVideos();

  // Get posts from followed users and friends
  const { data: followedUsersPosts = [], loading: followedPostsLoading } = useQuery({
    queryKey: ['followedUsersPosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

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

      if (allConnectedUserIds.length === 0) return [];

      // Get posts from these users
      const { data: posts } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles(*),
          post_media(*),
          post_tags(
            *,
            entity:taggable_entities(*)
          )
        `)
        .in('user_id', allConnectedUserIds)
        .order('created_at', { ascending: false })
        .limit(20);

      return posts || [];
    },
    enabled: !!user?.id,
  });

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

  // Convert all posts to the correct type
  const allUserPosts: UserPostWithType[] = [
    ...userPosts.map(post => ({ ...post, type: 'user_post' as const })),
    ...followedUsersPosts.map(post => ({ ...post, type: 'user_post' as const }))
  ];

  // Combine all content
  const allContent: (VideoPost | UserPostWithType)[] = [
    ...allUserPosts,
    ...realFriendVideos
  ];

  const sortedContent = sortContentByTime(allContent);

  if (sortedContent.length === 0) {
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
      {sortedContent.map((item) => (
        item.type === 'user_post' ? (
          <UserPost 
            key={item.id} 
            post={item} 
            onPostUpdated={refetchUserPosts}
            onPostDeleted={refetchUserPosts}
          />
        ) : (
          <PostCard key={item.id} post={item} />
        )
      ))}
    </div>
  );
};

export default TrendingFeed;


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
  const { data: followedUsersPosts = [], isLoading: followedPostsLoading } = useQuery({
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
          *
        `)
        .in('user_id', allConnectedUserIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!posts) return [];

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

      // Get post tags for all posts
      const { data: postTags } = await supabase
        .from('post_tags')
        .select(`
          *,
          taggable_entities (*)
        `)
        .in('post_id', posts.map(p => p.id));

      // Format posts with related data
      const formattedPosts = posts.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const media = postMedia?.filter(m => m.post_id === post.id) || [];
        const tags = postTags?.filter(t => t.post_id === post.id).map((tag: any) => ({
          id: tag.taggable_entities.id,
          entity_type: tag.taggable_entities.entity_type,
          entity_id: tag.taggable_entities.entity_id,
          name: tag.taggable_entities.name,
          username: tag.taggable_entities.username
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

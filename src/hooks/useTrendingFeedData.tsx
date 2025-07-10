import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export const useTrendingFeedData = () => {
  const { user } = useSupabaseSession();

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

      // Tags feature temporarily disabled due to missing database tables
      let postTags = [];

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

  return {
    followedUsersPosts,
    followedPostsLoading,
    refetchFollowedPosts
  };
};
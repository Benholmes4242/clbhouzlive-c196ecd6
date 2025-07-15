import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface ClubhouseFeedPost {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: {
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
  }[];
  post_tags: any[];
}

const POSTS_PER_PAGE = 20;

export const useClubhouseFeed = () => {
  const { user } = useSupabaseSession();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['clubhouse-feed', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return { posts: [], nextPage: null };

      // Get followed user IDs
      const { data: followsData, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) {
        console.error('Error fetching follows:', followsError);
        return { posts: [], nextPage: null };
      }

      const followedUserIds = followsData?.map(f => f.following_id) || [];

      if (followedUserIds.length === 0) {
        return { posts: [], nextPage: null };
      }

      // Fetch posts from followed users with media only
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media!inner(id, media_type, media_url)
        `)
        .in('user_id', followedUserIds)
        .order('created_at', { ascending: false })
        .range(pageParam * POSTS_PER_PAGE, (pageParam + 1) * POSTS_PER_PAGE - 1);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        return { posts: [], nextPage: null };
      }

      if (!postsData || postsData.length === 0) {
        return { posts: [], nextPage: null };
      }

      // Get user profiles for the posts
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return { posts: [], nextPage: null };
      }

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Format posts
      const formattedPosts: ClubhouseFeedPost[] = postsData.map(post => {
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
          post_tags: [] // Not implemented yet
        };
      });

      const nextPage = postsData.length === POSTS_PER_PAGE ? pageParam + 1 : null;

      return { posts: formattedPosts, nextPage };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });

  const posts = data?.pages.flatMap(page => page.posts) || [];

  return {
    posts,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  };
};
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface PostItem {
  id: string;
  content: string;
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

const POSTS_PER_PAGE = 10;

export const useInfiniteTrendingFeed = () => {
  const { user } = useSupabaseSession();
  const [allPosts, setAllPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);

  // Get connected user IDs
  const { data: connectedUserIds = [] } = useQuery({
    queryKey: ['connectedUserIds', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const [followsResponse, friendsResponse] = await Promise.all([
        supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id),
        supabase
          .from('user_friends')
          .select('user_id, friend_id')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted')
      ]);

      const followedUserIds = followsResponse.data?.map(f => f.following_id) || [];
      const friendUserIds = friendsResponse.data?.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ) || [];
      
      return [...new Set([...followedUserIds, ...friendUserIds])];
    },
    enabled: !!user?.id,
    staleTime: 300000,
  });

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || connectedUserIds.length === 0) {
      return;
    }

    setLoading(true);

    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media!inner(id, media_type, media_url)
        `)
        .in('user_id', connectedUserIds)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + POSTS_PER_PAGE - 1);

      if (error) {
        console.error('Error fetching posts:', error);
        setHasMore(false);
        return;
      }

      if (!posts || posts.length === 0) {
        setHasMore(false);
        return;
      }

      // Get profiles for the posts
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', [...new Set(posts.map(p => p.user_id))]);

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
          post_tags: []
        };
      });

      setAllPosts(prev => [...prev, ...formattedPosts]);
      setCurrentOffset(prev => prev + POSTS_PER_PAGE);

      if (posts.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, connectedUserIds, currentOffset]);

  // Reset when connected users change
  useEffect(() => {
    setAllPosts([]);
    setCurrentOffset(0);
    setHasMore(true);
  }, [connectedUserIds]);

  // Initial load
  useEffect(() => {
    if (connectedUserIds.length > 0 && allPosts.length === 0 && !loading) {
      loadMore();
    }
  }, [connectedUserIds, allPosts.length, loading, loadMore]);

  return {
    posts: allPosts,
    loading,
    hasMore,
    loadMore
  };
};
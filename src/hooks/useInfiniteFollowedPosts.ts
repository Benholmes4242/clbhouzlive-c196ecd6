import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { ExploreContentItem } from '@/components/explore/types';

export const useInfiniteFollowedPosts = () => {
  const { user } = useSupabaseSession();
  const [posts, setPosts] = useState<ExploreContentItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const postsPerPage = 10;

  const { data: exploreContent, isLoading } = useQuery({
    queryKey: ['followed-posts', user?.id, offset],
    queryFn: async (): Promise<ExploreContentItem[]> => {
      if (!user?.id) return [];

      // Get followed users
      const { data: followedUsers, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) {
        console.error('Error fetching followed users:', followError);
        return [];
      }

      const followedUserIds = followedUsers.map(f => f.following_id);

      if (followedUserIds.length === 0) {
        // If user doesn't follow anyone, return some discover content
        const { data: posts, error } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            post_media (
              id,
              media_type,
              media_url
            )
          `)
          .order('created_at', { ascending: false })
          .limit(postsPerPage)
          .range(offset, offset + postsPerPage - 1);

        if (error) {
          console.error('Error fetching discover posts:', error);
          return [];
        }

        // Get user profiles separately
        const userIds = posts.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, username, display_name, profile_photo_url')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        return posts.map(post => {
          const profile = profileMap.get(post.user_id);
          return {
            id: post.id,
            type: post.post_media?.[0]?.media_type === 'video' ? 'video' as const : 'image' as const,
            src: post.post_media?.[0]?.media_url || '',
            title: post.content || '',
            likes: 0,
            comments: 0,
            shares: 0,
            user: {
              id: profile?.id || '',
              name: profile?.display_name || profile?.username || 'Unknown',
              username: profile?.username || '',
              avatar: profile?.profile_photo_url || '/placeholder.svg',
              verified: false
            },
            timeAgo: new Date(post.created_at).toLocaleDateString(),
            media: post.post_media?.map(m => ({
              id: m.id,
              media_type: m.media_type as 'video' | 'image',
              media_url: m.media_url
            })) || []
          };
        });
      }

      // Get posts from followed users
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media (
            id,
            media_type,
            media_url
          )
        `)
        .in('user_id', followedUserIds)
        .order('created_at', { ascending: false })
        .limit(postsPerPage)
        .range(offset, offset + postsPerPage - 1);

      if (error) {
        console.error('Error fetching followed posts:', error);
        return [];
      }

      // Get user profiles separately
      const userIds = posts.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return posts.map(post => {
        const profile = profileMap.get(post.user_id);
        return {
          id: post.id,
          type: post.post_media?.[0]?.media_type === 'video' ? 'video' as const : 'image' as const,
          src: post.post_media?.[0]?.media_url || '',
          title: post.content || '',
          likes: 0,
          comments: 0,
          shares: 0,
          user: {
            id: profile?.id || '',
            name: profile?.display_name || profile?.username || 'Unknown',
            username: profile?.username || '',
            avatar: profile?.profile_photo_url || '/placeholder.svg',
            verified: false
          },
          timeAgo: new Date(post.created_at).toLocaleDateString(),
          media: post.post_media?.map(m => ({
            id: m.id,
            media_type: m.media_type as 'video' | 'image',
            media_url: m.media_url
          })) || []
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (exploreContent && offset === 0) {
      setPosts(exploreContent);
      setHasMore(exploreContent.length === postsPerPage);
    } else if (exploreContent && offset > 0) {
      setPosts(prev => [...prev, ...exploreContent]);
      setHasMore(exploreContent.length === postsPerPage);
      setIsLoadingMore(false);
    }
  }, [exploreContent, offset]);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      setOffset(prev => prev + postsPerPage);
    }
  };

  return {
    posts,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore
  };
};
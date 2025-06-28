
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mockExploreContent } from '@/components/explore/mockData';

interface ExplorePost {
  id: string;
  type: 'video' | 'image';
  src: string;
  title: string;
  likes: number;
  comments?: number;
  shares?: number;
  duration?: string;
  user?: {
    id: string;
    name: string;
    username?: string;
    avatar: string;
    verified?: boolean;
  };
  label?: string;
  isFollowing?: boolean;
}

const POSTS_PER_PAGE = 20;

export const useInfiniteExploreContent = () => {
  const [content, setContent] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [realPostsExhausted, setRealPostsExhausted] = useState(false);
  const [mockOffset, setMockOffset] = useState(0);

  const fetchRealPosts = async (currentOffset: number) => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media!inner (
            id,
            media_type,
            media_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + POSTS_PER_PAGE - 1);

      if (error) {
        console.error('Error fetching posts:', error);
        return [];
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map(post => post.user_id))];
      
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Format posts for explore grid
      const formattedPosts = postsData.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const media = (post.post_media || [])[0]; // Take first media item
        
        if (!media) return null;

        return {
          id: post.id,
          type: media.media_type as 'video' | 'image',
          src: media.media_url,
          title: post.content || 'Post',
          likes: Math.floor(Math.random() * 500) + 50,
          comments: Math.floor(Math.random() * 100) + 5,
          shares: Math.floor(Math.random() * 50) + 1,
          duration: media.media_type === 'video' ? `${Math.floor(Math.random() * 180) + 30}s` : undefined,
          user: {
            id: post.user_id,
            name: userProfile?.display_name || userProfile?.username || 'User',
            username: userProfile?.username,
            avatar: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            verified: Math.random() > 0.7 // Random verification for demo
          },
          label: Math.random() > 0.6 ? ['Pro Tip', 'Trending', 'From Clubhouse'][Math.floor(Math.random() * 3)] : undefined,
          isFollowing: Math.random() > 0.5
        };
      }).filter(Boolean) as ExplorePost[];

      return formattedPosts;
    } catch (error) {
      console.error('Error fetching real posts:', error);
      return [];
    }
  };

  const getMockPosts = (currentMockOffset: number) => {
    const start = currentMockOffset % mockExploreContent.length;
    const end = Math.min(start + POSTS_PER_PAGE, mockExploreContent.length);
    
    let posts = mockExploreContent.slice(start, end);
    
    // If we need more posts and reached end, wrap around
    if (posts.length < POSTS_PER_PAGE && mockExploreContent.length > 0) {
      const remaining = POSTS_PER_PAGE - posts.length;
      const wrappedPosts = mockExploreContent.slice(0, remaining);
      posts = [...posts, ...wrappedPosts.map(post => ({
        ...post,
        id: `${post.id}-${Math.random()}` // Ensure unique IDs
      }))];
    }
    
    return posts;
  };

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    if (!realPostsExhausted) {
      // Try to load real posts first
      const realPosts = await fetchRealPosts(offset);
      
      if (realPosts.length > 0) {
        setContent(prev => [...prev, ...realPosts]);
        setOffset(prev => prev + POSTS_PER_PAGE);
        
        // If we got fewer posts than requested, we've exhausted real posts
        if (realPosts.length < POSTS_PER_PAGE) {
          setRealPostsExhausted(true);
        }
      } else {
        // No more real posts, switch to mock data
        setRealPostsExhausted(true);
      }
    }

    if (realPostsExhausted) {
      // Load mock posts
      const mockPosts = getMockPosts(mockOffset);
      
      if (mockPosts.length > 0) {
        setContent(prev => [...prev, ...mockPosts]);
        setMockOffset(prev => prev + POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    }

    setLoading(false);
  }, [loading, hasMore, offset, realPostsExhausted, mockOffset]);

  // Initial load
  useEffect(() => {
    loadMore();
  }, []);

  return {
    content,
    loading,
    hasMore,
    loadMore
  };
};

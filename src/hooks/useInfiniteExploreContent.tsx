import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mockExploreContent } from '@/components/explore/mockData';
import { ExploreContentItem } from '@/components/explore/types';

const POSTS_PER_PAGE = 20;

export const useInfiniteExploreContent = () => {
  const [content, setContent] = useState<ExploreContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [realPostsExhausted, setRealPostsExhausted] = useState(false);
  const [mockOffset, setMockOffset] = useState(0);

  const isValidImageUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.log('Invalid URL - empty or not string:', url);
      return false;
    }
    
    // Check for common invalid patterns
    if (url === 'null' || url === 'undefined' || url === '') {
      console.log('Invalid URL - null/undefined string:', url);
      return false;
    }
    
    // Check if it's a valid URL format
    try {
      new URL(url);
      console.log('Valid URL:', url);
      return true;
    } catch {
      // If it's not a full URL, check if it's a relative path
      const isValid = url.startsWith('/') || url.startsWith('http');
      console.log('URL validation result:', url, isValid);
      return isValid;
    }
  };

  const fetchRealPosts = async (currentOffset: number) => {
    try {
      console.log('Fetching real posts from offset:', currentOffset);
      
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
        console.log('No posts data returned');
        return [];
      }

      console.log('Raw posts data:', postsData);

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

      console.log('User profiles:', profiles);

      // Format posts for explore grid
      const formattedPosts = postsData.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const media = (post.post_media || [])[0]; // Take first media item
        
        console.log('Processing post:', {
          postId: post.id,
          mediaUrl: media?.media_url,
          mediaType: media?.media_type,
          hasValidUrl: media ? isValidImageUrl(media.media_url) : false
        });
        
        if (!media || !isValidImageUrl(media.media_url)) {
          console.log('Skipping post due to invalid media:', post.id);
          return null;
        }

        const formattedPost = {
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

        console.log('Formatted post:', formattedPost);
        return formattedPost;
      }).filter(Boolean) as ExploreContentItem[];

      console.log('Final formatted posts:', formattedPosts);
      return formattedPosts;
    } catch (error) {
      console.error('Error fetching real posts:', error);
      return [];
    }
  };

  const getMockPosts = (currentMockOffset: number) => {
    console.log('Getting mock posts from offset:', currentMockOffset);
    
    const start = currentMockOffset % mockExploreContent.length;
    const end = Math.min(start + POSTS_PER_PAGE, mockExploreContent.length);
    
    let posts = mockExploreContent.slice(start, end);
    console.log('Initial mock posts slice:', posts.length);
    
    // Filter out posts with invalid image URLs
    posts = posts.filter(post => {
      const isValid = isValidImageUrl(post.src);
      if (!isValid) {
        console.log('Filtering out invalid mock post:', post.id, post.src);
      }
      return isValid;
    });
    
    console.log('Mock posts after filtering:', posts.length);
    
    // If we need more posts and reached end, wrap around
    if (posts.length < POSTS_PER_PAGE && mockExploreContent.length > 0) {
      const remaining = POSTS_PER_PAGE - posts.length;
      console.log('Need more posts, wrapping around for:', remaining);
      
      const wrappedPosts = mockExploreContent.slice(0, remaining)
        .filter(post => {
          const isValid = isValidImageUrl(post.src);
          if (!isValid) {
            console.log('Filtering out invalid wrapped post:', post.id, post.src);
          }
          return isValid;
        })
        .map(post => ({
          ...post,
          id: `${post.id}-${Math.random()}` // Ensure unique IDs
        }));
      posts = [...posts, ...wrappedPosts];
      console.log('Final mock posts with wrapped:', posts.length);
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
    // Reset state and start fresh
    setContent([]);
    setLoading(true);
    setHasMore(true);
    setOffset(0);
    setRealPostsExhausted(false);
    setMockOffset(0);
    
    // Load initial content
    const loadInitialContent = async () => {
      console.log('Loading initial content');
      const realPosts = await fetchRealPosts(0);
      
      if (realPosts.length > 0) {
        console.log('Setting initial real posts:', realPosts.length);
        setContent(realPosts);
        setOffset(POSTS_PER_PAGE);
        
        if (realPosts.length < POSTS_PER_PAGE) {
          setRealPostsExhausted(true);
          // Also load some mock data to fill the page
          const mockPosts = getMockPosts(0);
          console.log('Adding mock posts to fill page:', mockPosts.length);
          setContent(prev => [...prev, ...mockPosts]);
          setMockOffset(POSTS_PER_PAGE);
        }
      } else {
        // No real posts, start with mock data
        console.log('No real posts, starting with mock data');
        setRealPostsExhausted(true);
        const mockPosts = getMockPosts(0);
        setContent(mockPosts);
        setMockOffset(POSTS_PER_PAGE);
      }
      
      setLoading(false);
    };
    
    loadInitialContent();
  }, []);

  return {
    content,
    loading,
    hasMore,
    loadMore
  };
};

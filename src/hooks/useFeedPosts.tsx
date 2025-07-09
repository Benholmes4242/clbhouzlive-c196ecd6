import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface FeedPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: {
    id: string;
    display_name: string;
    username: string;
    profile_photo_url: string;
    verified?: boolean;
  };
  media?: {
    media_url: string;
    media_type: string;
  }[];
  engagement_stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  golf_course?: {
    id: string;
    name: string;
  };
  engagement_reason?: 'direct_follow' | 'liked_by_follow' | 'shared_by_follow' | 'commented_by_follow';
  engaged_by_users?: string[];
}

export const useFeedPosts = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseSession();

  const fetchFeedPosts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get users that the current user follows
      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) {
        throw followingError;
      }

      const followingIds = followingData?.map(f => f.following_id) || [];

      if (followingIds.length === 0) {
        // User doesn't follow anyone yet, show empty state
        setPosts([]);
        setLoading(false);
        return;
      }

      // Fetch posts from followed users with their media and author info
      const { data: directPosts, error: directPostsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media (
            media_url,
            media_type
          )
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(20);

      if (directPostsError) {
        throw directPostsError;
      }

      // Get unique user IDs from all posts
      const allUserIds = [...new Set(directPosts?.map(post => post.user_id) || [])];

      // Fetch user profiles for all posts
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .in('id', allUserIds);

      if (profilesError) {
        throw profilesError;
      }

      // TODO: In future, also fetch posts that were engaged with by followed users
      // This would require implementing like/share/comment tables first

      // Format the posts
      const formattedPosts: FeedPost[] = (directPosts || []).map(post => {
        const author = profiles?.find(p => p.id === post.user_id);
        
        // Sample golf courses for demo (in real implementation, this would come from database joins)
        const sampleCourses = [
          { id: '1', name: 'Walton Heath Golf Club (New)' },
          { id: '2', name: 'Royal St George\'s' },
          { id: '3', name: 'Carnoustie Golf Links' },
          { id: '4', name: 'St Andrews Old Course' },
          { id: '5', name: 'Turnberry (Ailsa)' }
        ];
        
        return {
          id: post.id,
          content: post.content || '',
          created_at: post.created_at,
          user_id: post.user_id,
          author: {
            id: post.user_id,
            display_name: author?.display_name || author?.username || 'User',
            username: author?.username || 'user',
            profile_photo_url: author?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            verified: Math.random() > 0.8 // Random verification for demo
          },
          media: post.post_media || [],
          golf_course: Math.random() > 0.5 ? sampleCourses[Math.floor(Math.random() * sampleCourses.length)] : undefined,
          engagement_stats: {
            likes: Math.floor(Math.random() * 100) + 1,
            comments: Math.floor(Math.random() * 25) + 1,
            shares: Math.floor(Math.random() * 10) + 1
          },
          engagement_reason: 'direct_follow' as const
        };
      }).filter(post => post.content.trim() !== '' || post.media.length > 0);

      setPosts(formattedPosts);
    } catch (err) {
      console.error('Error fetching feed posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feed posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedPosts();
  }, [user]);

  return {
    posts,
    loading,
    error,
    refetch: fetchFeedPosts
  };
};
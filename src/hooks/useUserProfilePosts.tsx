import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  poster_url?: string;
}

interface UserPost {
  id: string;
  content: string | null;
  created_at: string;
  post_media: PostMedia[];
}

export const useUserProfilePosts = (userId: string | null) => {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        setLoading(true);

        // Fetch posts for specific user
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(9); // Show latest 9 posts

        if (postsError) {
          console.error('Error fetching user posts:', postsError);
          setError('Failed to load posts');
          return;
        }

        if (!postsData || postsData.length === 0) {
          setPosts([]);
          return;
        }

        // Fetch media for these posts
        const postIds = postsData.map(p => p.id);
        const { data: mediaData, error: mediaError } = await supabase
          .from('post_media')
          .select('id, media_type, media_url, poster_url, post_id')
          .in('post_id', postIds);

        if (mediaError) {
          console.error('Error fetching post media:', mediaError);
          // Still show posts even if media fails
        }

        // Combine posts with their media
        const formattedPosts = postsData.map(post => ({
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          post_media: mediaData?.filter(m => m.post_id === post.id).map(m => ({
            id: m.id,
            media_type: m.media_type as 'image' | 'video',
            media_url: m.media_url,
            poster_url: m.poster_url || undefined
          })) || []
        }));

        // Only include posts that have media
        const postsWithMedia = formattedPosts.filter(post => post.post_media.length > 0);
        setPosts(postsWithMedia);

      } catch (error) {
        console.error('Error in fetchUserPosts:', error);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [userId]);

  return {
    posts,
    loading,
    error,
    isEmpty: !loading && posts.length === 0
  };
};
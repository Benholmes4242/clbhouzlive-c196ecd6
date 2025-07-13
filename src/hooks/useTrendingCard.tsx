import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTrendingCard = () => {
  const [trendingPost, setTrendingPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRandomPost = async () => {
    try {
      setLoading(true);
      
      // Get a random post with VIDEO media only from any user
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_media(*),
          user_profiles!posts_user_id_fkey(
            id,
            display_name,
            username,
            profile_photo_url
          ),
          post_tags(
            *,
            taggable_entities(*)
          )
        `)
        .not('post_media', 'is', null)
        .limit(50); // Get 50 posts to choose randomly from

      if (error) throw error;

      if (posts && posts.length > 0) {
        // Filter posts that have VIDEO media only
        const postsWithVideoMedia = posts.filter(post => 
          post.post_media && 
          post.post_media.length > 0 && 
          post.post_media.some(media => media.media_type === 'video')
        );
        
        if (postsWithVideoMedia.length > 0) {
          // Select a random post
          const randomIndex = Math.floor(Math.random() * postsWithVideoMedia.length);
          setTrendingPost(postsWithVideoMedia[randomIndex]);
        }
      }
    } catch (err) {
      console.error('Error fetching trending post:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomPost();

    // Listen for post deletion events to refresh the trending card
    const handlePostDeleted = () => {
      fetchRandomPost();
    };

    window.addEventListener('postDeleted', handlePostDeleted);
    return () => {
      window.removeEventListener('postDeleted', handlePostDeleted);
    };
  }, []);

  return {
    trendingPost,
    loading,
    error,
    refetch: fetchRandomPost
  };
};
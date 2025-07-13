import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTrendingCard = () => {
  const [trendingPost, setTrendingPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRandomPost = async () => {
    try {
      setLoading(true);
      console.log('Fetching trending video posts...');
      
      // First get posts with media
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_media(*)
        `)
        .not('post_media', 'is', null)
        .limit(50);

      if (error) throw error;
      console.log('Raw posts fetched:', posts?.length || 0);

      if (posts && posts.length > 0) {
        // Filter posts that have VIDEO media only
        const postsWithVideoMedia = posts.filter(post => 
          post.post_media && 
          post.post_media.length > 0 && 
          post.post_media.some(media => media.media_type === 'video')
        );
        
        console.log('Posts with video media:', postsWithVideoMedia.length);
        
        if (postsWithVideoMedia.length > 0) {
          // Select a random post
          const randomIndex = Math.floor(Math.random() * postsWithVideoMedia.length);
          const selectedPost = postsWithVideoMedia[randomIndex];
          
          // Get user profile separately
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('id, display_name, username, profile_photo_url')
            .eq('id', selectedPost.user_id)
            .single();
            
          // Attach user profile to post
          const postWithProfile = {
            ...selectedPost,
            user_profiles: userProfile
          };
          
          console.log('Selected trending post:', selectedPost.id, 'by', userProfile?.username);
          setTrendingPost(postWithProfile);
        } else {
          console.log('No video posts found for trending card');
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
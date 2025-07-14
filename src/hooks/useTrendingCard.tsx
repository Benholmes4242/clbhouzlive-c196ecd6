import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTrendingCard = () => {
  const [trendingPosts, setTrendingPosts] = useState([]);
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
          // Shuffle and select 3 different posts to ensure no duplicates
          const shuffled = [...postsWithVideoMedia].sort(() => 0.5 - Math.random());
          const selectedPosts = shuffled.slice(0, Math.min(3, postsWithVideoMedia.length));
          
          // Get user profiles for all selected posts
          const postsWithProfiles = await Promise.all(
            selectedPosts.map(async (post) => {
              const { data: userProfile } = await supabase
                .from('user_profiles')
                .select('id, display_name, username, profile_photo_url')
                .eq('id', post.user_id)
                .single();
                
              return {
                ...post,
                user_profiles: userProfile
              };
            })
          );
          
          console.log('Selected trending posts:', postsWithProfiles.length, 'unique posts');
          setTrendingPosts(postsWithProfiles);
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
    trendingPosts,
    loading,
    error,
    refetch: fetchRandomPost
  };
};
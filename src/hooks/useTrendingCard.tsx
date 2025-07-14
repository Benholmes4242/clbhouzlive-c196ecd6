import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTrendingCard = () => {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [allTrendingPosts, setAllTrendingPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTrendingPosts = async () => {
    try {
      setLoading(true);
      console.log('Fetching trending video posts...');
      
      // First get posts with media and tags
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_media(*),
          post_tags(
            *,
            taggable_entities(*)
          )
        `)
        .not('post_media', 'is', null)
        .limit(100);

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
          // Shuffle all posts for carousel
          const shuffled = [...postsWithVideoMedia].sort(() => 0.5 - Math.random());
          
          // Get user profiles for all posts
          const postsWithProfiles = await Promise.all(
            shuffled.map(async (post) => {
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
          
          console.log('All trending posts loaded:', postsWithProfiles.length);
          setAllTrendingPosts(postsWithProfiles);
          // Set initial visible posts (first 3 for desktop, first 1 for mobile)
          setTrendingPosts(postsWithProfiles.slice(0, 3));
        } else {
          console.log('No video posts found for trending card');
        }
      }
    } catch (err) {
      console.error('Error fetching trending posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (allTrendingPosts.length === 0) return;
    
    const newIndex = (currentIndex + 1) % allTrendingPosts.length;
    setCurrentIndex(newIndex);
    
    // Update visible posts for carousel
    const nextPosts = [];
    for (let i = 0; i < 3; i++) {
      const postIndex = (newIndex + i) % allTrendingPosts.length;
      nextPosts.push(allTrendingPosts[postIndex]);
    }
    setTrendingPosts(nextPosts);
  };

  const prevSlide = () => {
    if (allTrendingPosts.length === 0) return;
    
    const newIndex = currentIndex === 0 ? allTrendingPosts.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    
    // Update visible posts for carousel
    const prevPosts = [];
    for (let i = 0; i < 3; i++) {
      const postIndex = (newIndex + i) % allTrendingPosts.length;
      prevPosts.push(allTrendingPosts[postIndex]);
    }
    setTrendingPosts(prevPosts);
  };

  useEffect(() => {
    fetchTrendingPosts();

    // Listen for post deletion events to refresh the trending card
    const handlePostDeleted = () => {
      fetchTrendingPosts();
    };

    window.addEventListener('postDeleted', handlePostDeleted);
    return () => {
      window.removeEventListener('postDeleted', handlePostDeleted);
    };
  }, []);

  return {
    trendingPosts,
    loading,
    nextSlide,
    prevSlide,
    currentIndex,
    totalPosts: allTrendingPosts.length,
    refetch: fetchTrendingPosts
  };
};
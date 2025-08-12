
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ActivityPost } from '../types/ActivityTypes';

export const useActivityPosts = (userId?: string) => {
  const [posts, setPosts] = useState<ActivityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    console.log('ActivityPosts - Fetching posts for userId:', userId);
    setLoading(true);

    try {
      // Get posts with media and tags using direct query
      const { data: postsData, error } = await supabase
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('ActivityPosts - Error with posts query:', error);
        setPosts([]);
        setLoading(false);
        return;
      }

      console.log('ActivityPosts - Raw posts data:', postsData);
      console.log('ActivityPosts - Detailed posts data:', JSON.stringify(postsData, null, 2));

      if (!postsData || postsData.length === 0) {
        console.log('ActivityPosts - No posts found for user');
        setPosts([]);
        setLoading(false);
        return;
      }

      // Post tags temporarily disabled due to missing database tables
      let postTags = [];

      console.log('ActivityPosts - Mapped post tags:', postTags);

      // Get user profile for the posts
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('ActivityPosts - Error fetching user profile:', profileError);
      }

      const formattedPosts = postsData.map(post => {
        const tags = postTags?.filter((t: any) => t.post_id === post.id) || [];
        
        console.log('ActivityPosts - Processing post:', {
          id: post.id,
          mediaCount: post.post_media?.length || 0,
          mediaData: post.post_media
        });
        
        return {
          id: post.id,
          type: 'post' as const,
          content: post.content || '',
          likes: 0,
          comments: 0,
          shares: 0,
          timeAgo: new Date(post.created_at).toLocaleDateString(),
          created_at: post.created_at,
          post_media: (post.post_media || []).map(media => ({
            id: media.id,
            media_type: media.media_type as 'image' | 'video',
            media_url: media.media_url
          })),
          post_tags: tags,
          user: {
            id: userId,
            display_name: userProfile?.display_name || null,
            username: userProfile?.username || null,
            profile_photo_url: userProfile?.profile_photo_url || null
          },
          image: post.post_media?.find(media => media.media_type === 'image')?.media_url
        };
      });

      console.log('ActivityPosts - Final formatted posts:', formattedPosts.length);
      setPosts(formattedPosts);
    } catch (error) {
      console.error('ActivityPosts - Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, [userId]);

  // Listen for post updates
  useEffect(() => {
    const handlePostCompleted = () => {
      console.log('ActivityPosts - Post completed event received, refetching');
      setTimeout(() => {
        fetchUserPosts();
      }, 1000);
    };

    window.addEventListener('postCompleted', handlePostCompleted);
    
    return () => {
      window.removeEventListener('postCompleted', handlePostCompleted);
    };
  }, []);

  return { posts, loading, fetchUserPosts };
};

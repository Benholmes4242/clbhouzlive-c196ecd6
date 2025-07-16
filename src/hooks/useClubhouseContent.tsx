
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClubhousePost {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
    user_type: 'individual' | 'club' | 'pro_shop' | 'academy' | 'tour_event' | 'other' | null;
    business_name: string | null;
    eg_handicap_index?: number | null;
  };
  post_media: {
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
  }[];
  post_tags: {
    id: string;
    entity_type: 'user' | 'golf_club' | 'business';
    entity_id: string;
    name: string;
    username: string | null;
  }[];
  stats?: {
    likes: number;
    comments: number;
    views: number;
  };
}

export const useClubhouseContent = () => {
  const [posts, setPosts] = useState<ClubhousePost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRandomContent = async () => {
    setLoading(true);
    try {
      console.log('Fetching clubhouse content - all posts with media');
      
      // Fetch all posts with media (not just videos)
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
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      console.log('Clubhouse - Raw posts data:', postsData);

      if (!postsData || postsData.length === 0) {
        console.log('No posts found for clubhouse');
        setPosts([]);
        return;
      }

      // Filter posts that have media
      const postsWithMedia = postsData.filter(post => post.post_media && post.post_media.length > 0);
      console.log('Posts with media:', postsWithMedia.length);

      // Get unique user IDs
      const userIds = [...new Set(postsWithMedia.map(post => post.user_id))];
      console.log('Fetching profiles for users:', userIds);
      
      // Get user profiles for all post authors with handicap data
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, user_type, business_name, eg_handicap_index')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      console.log('Clubhouse - Fetched profiles:', profiles);

      // Post tags temporarily disabled due to missing database tables
      let postTags = [];

      console.log('Clubhouse - Post tags:', postTags);

      // Format posts with user data including handicap
      const formattedPosts = postsWithMedia.map(post => {
        const userProfile = profiles?.find(profile => profile.id === post.user_id);
        const tags = postTags?.filter((t: any) => t.post_id === post.id) || [];
        
        return {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          user: {
            id: post.user_id,
            display_name: userProfile?.display_name || null,
            username: userProfile?.username || null,
            profile_photo_url: userProfile?.profile_photo_url || null,
            user_type: userProfile?.user_type || null,
            business_name: userProfile?.business_name || null,
            eg_handicap_index: userProfile?.eg_handicap_index || null,
          },
          post_media: (post.post_media || []).map(media => ({
            id: media.id,
            media_type: media.media_type as 'image' | 'video',
            media_url: media.media_url
          })),
          post_tags: tags,
          stats: {
            likes: Math.floor(Math.random() * 100),
            comments: Math.floor(Math.random() * 50),
            views: Math.floor(Math.random() * 1000)
          }
        };
      });

      console.log('Clubhouse - Final formatted posts:', formattedPosts.length);

      // Sort by a blend of recent and random content for discovery
      const sortedPosts = formattedPosts.sort((a, b) => {
        const aScore = new Date(a.created_at).getTime() + Math.random() * 86400000;
        const bScore = new Date(b.created_at).getTime() + Math.random() * 86400000;
        return bScore - aScore;
      });

      setPosts(sortedPosts);

    } catch (error) {
      console.error('Error fetching clubhouse content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomContent();
  }, []);

  // Listen for new posts
  useEffect(() => {
    const handlePostCompleted = () => {
      console.log('Post completed event received in clubhouse, refetching');
      setTimeout(() => {
        fetchRandomContent();
      }, 1000);
    };

    window.addEventListener('postCompleted', handlePostCompleted);
    
    return () => {
      window.removeEventListener('postCompleted', handlePostCompleted);
    };
  }, []);

  return {
    posts,
    loading,
    refetch: fetchRandomContent
  };
};

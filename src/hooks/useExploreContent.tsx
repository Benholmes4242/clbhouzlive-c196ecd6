
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExplorePost {
  id: string;
  type: 'video' | 'image';
  src: string;
  title: string;
  likes: number;
  user?: {
    id: string;
    name: string;
    avatar: string;
    verified?: boolean;
  };
  label?: string;
  isFollowing?: boolean;
}

export const useExploreContent = () => {
  const [content, setContent] = useState<ExplorePost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExploreContent = async () => {
    setLoading(true);
    try {
      // Fetch posts with media from all users
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
        .limit(50);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setContent([]);
        return;
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
        return;
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
          likes: Math.floor(Math.random() * 100), // Placeholder until we have actual likes
          user: {
            id: post.user_id,
            name: userProfile?.display_name || userProfile?.username || 'User',
            avatar: userProfile?.profile_photo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            verified: false // Placeholder
          },
          isFollowing: false // Placeholder
        };
      }).filter(Boolean) as ExplorePost[];

      setContent(formattedPosts);

    } catch (error) {
      console.error('Error fetching explore content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExploreContent();
  }, []);

  return {
    content,
    loading,
    refetch: fetchExploreContent
  };
};

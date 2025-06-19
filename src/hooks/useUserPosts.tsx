
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

interface PostMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
}

interface UserPostData {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: PostMedia[];
}

export const useUserPosts = () => {
  const { user } = useSupabaseSession();
  const [posts, setPosts] = useState<UserPostData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          user_profiles!posts_user_id_fkey (
            id,
            display_name,
            username,
            profile_photo_url
          ),
          post_media (
            id,
            media_type,
            media_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      const formattedPosts = postsData.map(post => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        user: {
          id: post.user_profiles?.id || post.user_id,
          display_name: post.user_profiles?.display_name,
          username: post.user_profiles?.username,
          profile_photo_url: post.user_profiles?.profile_photo_url
        },
        post_media: post.post_media || []
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  return {
    posts,
    loading,
    refetch: fetchPosts
  };
};

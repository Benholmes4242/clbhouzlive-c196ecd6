import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePostData = () => {
  const [loading, setLoading] = useState(false);

  const fetchPostWithDetails = useCallback(async (postId: string) => {
    setLoading(true);
    try {
      // Fetch post with all related data
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles(
            id,
            display_name,
            username,
            profile_photo_url
          ),
          post_media(*),
          post_tags(
            id,
            tagged_entity_id,
            tagged_by_user_id,
            tagged_entity:taggable_entities(
              id,
              entity_type,
              entity_id,
              name,
              username
            )
          )
        `)
        .eq('id', postId)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        throw postError;
      }

      console.log('Fetched post with details:', post);
      return post;
    } catch (error) {
      console.error('Error in fetchPostWithDetails:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserPosts = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_profiles(
            id,
            display_name,
            username,
            profile_photo_url
          ),
          post_media(*),
          post_tags(
            id,
            tagged_entity_id,
            tagged_by_user_id,
            tagged_entity:taggable_entities(
              id,
              entity_type,
              entity_id,
              name,
              username
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching user posts:', postsError);
        throw postsError;
      }

      console.log('Fetched user posts:', posts);
      return posts;
    } catch (error) {
      console.error('Error in fetchUserPosts:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchPostWithDetails,
    fetchUserPosts,
    loading
  };
};
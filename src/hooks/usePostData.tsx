import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildVisibilityFilter } from '@/utils/visibilityFilter';

export const usePostData = () => {
  const [loading, setLoading] = useState(false);

  const fetchPostWithDetails = useCallback(async (postId: string) => {
    setLoading(true);
    try {
      // Get current user for visibility check
      const { data: { user } } = await supabase.auth.getUser();
      const visibilityFilter = buildVisibilityFilter(user?.id ?? null);
      
      // Fetch post with all related data
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          actor_type,
          actor_id,
          user:user_profiles(
            id,
            display_name,
            username,
            profile_photo_url
          ),
          business:business_accounts!actor_id(
            id,
            name,
            slug,
            logo_url
          ),
          post_media(*),
          post_tags(
            id,
            tagged_entity_id,
            tagged_by_user_id,
            start_index,
            end_index,
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
        .or(visibilityFilter)
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
      // Get current user for visibility check
      const { data: { user } } = await supabase.auth.getUser();
      const visibilityFilter = buildVisibilityFilter(user?.id ?? null);
      const isOwnProfile = user?.id === userId;
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          actor_type,
          actor_id,
          user:user_profiles(
            id,
            display_name,
            username,
            profile_photo_url
          ),
          business:business_accounts!actor_id(
            id,
            name,
            slug,
            logo_url
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
      
      // Apply visibility filter only when viewing someone else's posts
      if (!isOwnProfile) {
        query = query.or(visibilityFilter);
      }
      
      const { data: posts, error: postsError } = await query;
      
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
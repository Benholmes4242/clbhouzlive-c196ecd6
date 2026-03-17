import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface PostTag {
  tagged_entity_id: string;
  start_index: number;
  end_index: number;
}

export const usePostTags = () => {
  const savePostTags = useCallback(async (postId: string, tags: PostTag[], taggedByUserId?: string) => {
    if (tags.length === 0) return;

    try {
      let userId = taggedByUserId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }

      if (!userId) {
        throw new Error('User must be authenticated to save post tags');
      }

      const tagsWithPostId = tags.map(tag => ({
        post_id: postId,
        tagged_by_user_id: userId,
        ...tag
      }));

      const { error } = await supabase
        .from('post_tags')
        .insert(tagsWithPostId);

      if (error) {
        console.error('Error saving post tags:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in savePostTags:', error);
      throw error;
    }
  }, []);

  const getPostTags = useCallback(async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('post_tags')
        .select(`
          *,
          taggable_entities:tagged_entity_id (
            id,
            entity_type,
            entity_id,
            name,
            username
          )
        `)
        .eq('post_id', postId)
        .order('start_index');

      if (error) {
        console.error('Error fetching post tags:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPostTags:', error);
      return [];
    }
  }, []);

  const deletePostTags = useCallback(async (postId: string) => {
    try {
      const { error } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', postId);

      if (error) {
        console.error('Error deleting post tags:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deletePostTags:', error);
      throw error;
    }
  }, []);

  return {
    savePostTags,
    getPostTags,
    deletePostTags
  };
};
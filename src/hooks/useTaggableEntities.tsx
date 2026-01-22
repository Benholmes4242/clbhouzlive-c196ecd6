
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'business'; // Only mentionable types
  entity_id: string;
  name: string;
  username: string | null;
  profile_image_url?: string | null;
}

export const useTaggableEntities = () => {
  const [entities, setEntities] = useState<TaggableEntity[]>([]);
  const [loading, setLoading] = useState(false);

  const searchEntities = useCallback(async (query: string) => {
    if (query.length < 1) {
      setEntities([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('taggable_entities')
        .select('id, entity_type, entity_id, name, username, profile_image_url')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .in('entity_type', ['user', 'business'])
        .order('name')
        .limit(8);

      if (error) {
        console.error('Error searching entities:', error);
        setEntities([]);
        return;
      }

      // Type assertion to ensure proper typing
      const typedData = (data || []) as TaggableEntity[];
      setEntities(typedData);
    } catch (error) {
      console.error('Error searching entities:', error);
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGolfClubEntity = async (name: string) => {
    try {
      // For golf clubs, we would need to create a new golf_course entry first
      // This is a simplified version - in practice you'd want more validation
      const { data: courseData, error: courseError } = await supabase
        .from('golf_courses')
        .insert({
          name,
          country: null,
          continent: null
        })
        .select()
        .single();

      if (courseError) {
        console.error('Error creating golf course:', courseError);
        return null;
      }

      return courseData;
    } catch (error) {
      console.error('Error creating golf club entity:', error);
      return null;
    }
  };

  const createBusinessEntity = async (name: string, username?: string) => {
    try {
      // This would create a business user profile
      // In practice, this should be handled through proper user registration
      return null;
    } catch (error) {
      console.error('Error creating business entity:', error);
      return null;
    }
  };

  return {
    entities,
    loading,
    searchEntities,
    createGolfClubEntity,
    createBusinessEntity
  };
};

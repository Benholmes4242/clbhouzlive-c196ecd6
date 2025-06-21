
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

export const useTaggableEntities = () => {
  const [entities, setEntities] = useState<TaggableEntity[]>([]);
  const [loading, setLoading] = useState(false);

  const searchEntities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setEntities([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('taggable_entities')
        .select('*')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setEntities(data || []);
    } catch (error) {
      console.error('Error searching entities:', error);
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGolfClubEntity = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('taggable_entities')
        .insert({
          entity_type: 'golf_club',
          entity_id: crypto.randomUUID(),
          name,
          username: null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating golf club entity:', error);
      return null;
    }
  };

  const createBusinessEntity = async (name: string, username?: string) => {
    try {
      const { data, error } = await supabase
        .from('taggable_entities')
        .insert({
          entity_type: 'business',
          entity_id: crypto.randomUUID(),
          name,
          username: username || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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

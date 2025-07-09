
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
        .limit(20); // Get more results initially to allow for deduplication

      if (error) throw error;
      
      // Type assertion and deduplication
      const typedData = (data || []).map(item => ({
        ...item,
        entity_type: item.entity_type as 'user' | 'golf_club' | 'business'
      }));
      
      // Deduplicate by entity_id and entity_type combination
      const uniqueEntities = typedData.reduce((acc: TaggableEntity[], current) => {
        const exists = acc.find(item => 
          item.entity_id === current.entity_id && 
          item.entity_type === current.entity_type
        );
        
        if (!exists) {
          acc.push(current);
        }
        
        return acc;
      }, []);
      
      // Limit to 10 results after deduplication
      setEntities(uniqueEntities.slice(0, 10));
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
      return data ? {
        ...data,
        entity_type: data.entity_type as 'user' | 'golf_club' | 'business'
      } : null;
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
      return data ? {
        ...data,
        entity_type: data.entity_type as 'user' | 'golf_club' | 'business'
      } : null;
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

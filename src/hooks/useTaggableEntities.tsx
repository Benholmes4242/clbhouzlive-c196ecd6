
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
      // Taggable entities temporarily disabled due to missing database tables
      setEntities([]);
    } catch (error) {
      console.error('Error searching entities:', error);
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGolfClubEntity = async (name: string) => {
    try {
      // Entity creation temporarily disabled due to missing database tables
      return null;
    } catch (error) {
      console.error('Error creating golf club entity:', error);
      return null;
    }
  };

  const createBusinessEntity = async (name: string, username?: string) => {
    try {
      // Entity creation temporarily disabled due to missing database tables
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

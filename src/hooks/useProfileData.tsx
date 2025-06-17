
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

export const useProfileData = () => {
  const { user } = useSupabaseSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchProfile(user.id).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);

  return {
    user,
    profile,
    loading,
    setProfile,
    fetchProfile
  };
};

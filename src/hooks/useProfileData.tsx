
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

export const useProfileData = () => {
  const { user } = useSupabaseSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
        return;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch profile');
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    if (user) {
      setLoading(true);
      fetchProfile(user.id).finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    } else {
      // Important: Set loading to false when there's no user
      setLoading(false);
      setProfile(null);
      setError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only re-run when user ID changes

  return {
    user,
    profile,
    loading,
    error,
    setProfile,
    fetchProfile
  };
};

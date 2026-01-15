import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { PROFILE_FULL } from '@/lib/supabase/selects';

export const useProfileData = () => {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string, forceRefresh = false) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*') // Full profile needed
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
        return;
      }
      
      console.log('Fetched profile data:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch profile');
    }
  };

  const refreshProfile = () => {
    if (user?.id) {
      setLoading(true);
      fetchProfile(user.id, true).finally(() => {
        setLoading(false);
      });
    }
  };

  const updateProfileField = (field: string, value: any) => {
    setProfile((prev: any) => prev ? { ...prev, [field]: value } : prev);
  };

  useEffect(() => {
    let isMounted = true;
    
    // Wait for session loading to complete
    if (sessionLoading) {
      return;
    }
    
    if (user) {
      setLoading(true);
      fetchProfile(user.id).finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    } else {
      // Important: Set loading to false when there's no user
      if (isMounted) {
        setLoading(false);
        setProfile(null);
        setError(null);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id, sessionLoading]); // Include sessionLoading in dependencies

  return {
    user,
    profile,
    loading: sessionLoading || loading, // Combined loading state
    error,
    setProfile,
    fetchProfile,
    refreshProfile,
    updateProfileField
  };
};

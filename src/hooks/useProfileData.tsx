import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

interface UserProfile {
  id: string;
  display_name?: string;
  username?: string;
  home_club?: string;
  profile_photo_url?: string;
  profile_video_url?: string;
  profile_video_thumbnail_url?: string;
  has_profile_video?: boolean;
  background_image_url?: string;
  cover_photo_url?: string;
  bio?: string;
  eg_handicap_index?: number;
  eg_app_connected?: boolean;
  user_type?: string;
  is_public?: boolean;
}

export const useProfileData = () => {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string, forceRefresh = false) => {
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
    setProfile((prev) => prev ? { ...prev, [field]: value } : prev);
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
      // Set loading to false when there's no user
      if (isMounted) {
        setLoading(false);
        setProfile(null);
        setError(null);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id, sessionLoading]);

  return {
    user,
    profile,
    loading: sessionLoading || loading,
    error,
    setProfile,
    fetchProfile,
    refreshProfile,
    updateProfileField
  };
};
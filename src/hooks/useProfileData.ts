import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const useProfileData = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Get current user from Supabase auth
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          // Suppress expected auth errors on auth pages (no session is normal there)
          const isAuthPage = window.location.pathname === '/auth' || 
                            window.location.pathname.startsWith('/auth/');
          const isExpectedError = error.name === 'AuthSessionMissingError' || 
                                  error.message?.includes('Auth session missing');
          
          if (!isAuthPage || !isExpectedError) {
            console.error('Error getting user:', error);
          }
        }
        setUser(user);
      } catch (error) {
        // Suppress expected auth errors on auth pages
        const isAuthPage = window.location.pathname === '/auth' || 
                          window.location.pathname.startsWith('/auth/');
        if (!isAuthPage) {
          console.error('Error in getUser:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Get profile data using React Query
  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: fetchProfile 
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*') // Full profile needed - many components depend on various fields
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 0, // Always refetch after invalidation
  });

  const refreshProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    await fetchProfile();
  };

  const fetchProfileById = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    await queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
    return fetchProfile();
  };

  const setProfile = (newProfile: any) => {
    queryClient.setQueryData(['profile', user?.id], newProfile);
  };

  const updateProfileField = async (field: string, value: any) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ [field]: value })
        .eq('id', user.id);

      if (error) throw error;

      // Update the cached profile data
      queryClient.setQueryData(['profile', user?.id], (oldProfile: any) => ({
        ...oldProfile,
        [field]: value
      }));
    } catch (error) {
      console.error('Error updating profile field:', error);
      throw error;
    }
  };

  return {
    user,
    profile,
    loading: loading || (!!user?.id && profileLoading),
    error: profileError,
    setProfile,
    fetchProfile: fetchProfileById, // Support calling with optional userId
    refreshProfile,
    updateProfileField
  };
};
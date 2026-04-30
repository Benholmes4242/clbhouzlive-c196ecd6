import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export const useProfileData = () => {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const queryClient = useQueryClient();

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
    enabled: !sessionLoading && !!user?.id,
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
    loading: sessionLoading || (!!user?.id && profileLoading),
    error: profileError,
    setProfile,
    fetchProfile: fetchProfileById, // Support calling with optional userId
    refreshProfile,
    updateProfileField
  };
};
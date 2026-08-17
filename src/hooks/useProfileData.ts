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
    // eslint-disable-next-line settled/no-not-loading-empty-check -- this is a query enabled: clause, not a decision about absent data.
    enabled: !sessionLoading && !!user?.id,
    staleTime: 0, // Always stale: with the global refetchOnMount: true this refetches on every mount
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

  type ProfileRow = NonNullable<typeof profile>;

  const setProfile = (newProfile: ProfileRow | null) => {
    queryClient.setQueryData(['profile', user?.id], newProfile);
  };

  const updateProfileField = async <K extends keyof ProfileRow>(field: K & string, value: ProfileRow[K]) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ [field]: value })
        .eq('id', user.id);

      if (error) throw error;

      // Update the cached profile data
      queryClient.setQueryData(['profile', user?.id], (oldProfile: ProfileRow | null | undefined) => ({
        ...(oldProfile ?? {}),
        [field]: value,
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
    isError: !!profileError,
    refetch: fetchProfile,
    setProfile,
    fetchProfile: fetchProfileById, // Support calling with optional userId
    refreshProfile,
    updateProfileField
  };
};
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { isGuestUser } from '@/features/guest/useIsGuest';

export const useProfileData = () => {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const queryClient = useQueryClient();
  // Guest flag in the key: a guest keeps the same id when they join, so a
  // user-id-only key would keep the cached guest null after conversion.
  const isGuest = isGuestUser(user);
  const key = ['profile', user?.id, isGuest] as const;

  // Get profile data using React Query
  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError,
    refetch: fetchProfile 
  } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!user?.id) return null;
      // Guests (anonymous sessions) have no profile by design — never read it.
      if (user.is_anonymous) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*') // Full profile needed - many components depend on various fields
        .eq('id', user.id)
        // maybeSingle: the row can legitimately be missing (e.g. the moment
        // after a guest converts, before the server trigger creates it).
        .maybeSingle();

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
    queryClient.setQueryData(key, newProfile);
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
      queryClient.setQueryData(key, (oldProfile: ProfileRow | null | undefined) => ({
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Club {
  id: string;
  name: string;
  isPrimary?: boolean;
}

interface UseProfileClubsResult {
  homeClub: Club | null;
  secondaryClubs: Club[];
  isLoading: boolean;
  isPrivate: boolean;
}

/**
 * Fetches clubs for a user profile using get_home_clubs_for_user RPC.
 * The RPC respects visibility rules and returns null if blocked.
 */
export const useProfileClubs = (
  profileId: string | undefined,
  viewerUserId: string | undefined
): UseProfileClubsResult => {
  const { data, isLoading } = useQuery({
    queryKey: ['profile-clubs', profileId, viewerUserId],
    queryFn: async () => {
      if (!profileId) return { homeClub: null, secondaryClubs: [], isPrivate: false };

      // First get the primary home club from user_profiles
      // Include home_club text field as fallback if FK join fails
      const { data: profile } = await supabase
        .from('user_profiles')
        .select(`
          home_club_id,
          home_club,
          home_club_visibility,
          home_club_join:golf_clubs!home_club_id(id, name)
        `)
        .eq('id', profileId)
        .single();

      // Check visibility for home club
      // Note: visibility uses 'public', 'friends', 'private' - not 'everyone'
      const isOwner = viewerUserId === profileId;
      const visibility = profile?.home_club_visibility ?? 'public';
      const canSeeHomeClub = isOwner || visibility === 'public';

      let homeClub: Club | null = null;
      if (canSeeHomeClub) {
        // Try FK join first
        if (profile?.home_club_join) {
          const club = profile.home_club_join as unknown as { id: string; name: string };
          homeClub = {
            id: club.id,
            name: club.name,
            isPrimary: true
          };
        } 
        // Fallback to text field if FK join failed but home_club text exists
        else if (profile?.home_club && typeof profile.home_club === 'string') {
          homeClub = {
            id: profile.home_club_id ?? 'text-fallback',
            name: profile.home_club,
            isPrimary: true
          };
        }
      }

      // Get secondary clubs using RPC
      const { data: secondaryData } = await supabase
        .rpc('get_home_clubs_for_user', { p_user_profile_id: profileId });

      const secondaryClubs: Club[] = Array.isArray(secondaryData)
        ? secondaryData
            .filter((c: any) => c.club_id !== profile?.home_club_id)
            .map((c: any) => ({
              id: c.club_id,
              name: c.club_name
            }))
        : [];

      // Determine if clubs are private (RPC returned null for non-owner)
      const isPrivate = !isOwner && !homeClub && secondaryClubs.length === 0 && 
        visibility === 'private';

      return { homeClub, secondaryClubs, isPrivate };
    },
    enabled: !!profileId
  });

  return {
    homeClub: data?.homeClub ?? null,
    secondaryClubs: data?.secondaryClubs ?? [],
    isLoading,
    isPrivate: data?.isPrivate ?? false
  };
};

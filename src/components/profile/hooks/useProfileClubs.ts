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

      // Fetch canonical home club fields from user_profiles.
      // NOTE: the app writes the canonical club id to `primary_club_id` (not `home_club_id`).
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('primary_club_id, home_club, home_club_visibility')
        .eq('id', profileId)
        .maybeSingle();

      if (profileError) {
        console.error('[useProfileClubs] Failed to load profile club fields:', profileError);
      }

      // Check visibility for home club
      const isOwner = viewerUserId === profileId;
      const visibility = (profile as any)?.home_club_visibility ?? 'public';
      const canSeeHomeClub = isOwner || visibility === 'public';

      let homeClub: Club | null = null;

      // Prefer the denormalized text name (this is what the profile header uses)
      if (canSeeHomeClub && (profile as any)?.home_club) {
        homeClub = {
          id: (profile as any)?.primary_club_id ?? 'text-fallback',
          name: (profile as any).home_club as string,
          isPrimary: true,
        };
      }

      // Optional: if text is missing but we have a canonical id, fetch the club name
      if (!homeClub && canSeeHomeClub && (profile as any)?.primary_club_id) {
        const { data: clubRow, error: clubErr } = await supabase
          .from('golf_clubs')
          .select('id, name')
          .eq('id', (profile as any).primary_club_id)
          .maybeSingle();

        if (!clubErr && clubRow) {
          homeClub = { id: clubRow.id, name: clubRow.name, isPrimary: true };
        }
      }

      // Get secondary clubs using RPC (viewer-aware)
      let secondaryClubs: Club[] = [];
      
      // Always pass viewer_id to RPC for proper visibility checks
      const { data: rpcResult, error: rpcError } = await supabase.rpc('get_home_clubs_for_user', {
        p_user_profile_id: profileId,
        p_viewer_id: viewerUserId ?? profileId, // Owner viewing self should always see their clubs
      });

      if (rpcError) {
        console.error('[useProfileClubs] RPC error:', rpcError);
      }

      // Parse RPC response - shape: { additional_preview: [{id, name}], additional_count, primary_club, user_id }
      if (rpcResult && typeof rpcResult === 'object' && !Array.isArray(rpcResult)) {
        const preview = (rpcResult as any).additional_preview;
        if (Array.isArray(preview)) {
          secondaryClubs = preview
            .map((c: any) => ({ id: c.id, name: c.name }))
            .filter((c: Club) => c.id && c.name);
        }
      }

      // Determine if clubs are private (nothing visible and not public)
      const isPrivate =
        !isOwner && !homeClub && secondaryClubs.length === 0 && visibility !== 'public';

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

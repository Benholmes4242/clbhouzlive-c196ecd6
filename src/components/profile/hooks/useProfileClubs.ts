import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

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
 * Expected shape of `get_home_clubs_for_user` RPC response.
 * If the RPC evolves, update this type and parsing logic.
 */
interface ClubsRpcResult {
  user_id: string;
  primary_club: { id: string; name: string } | null;
  additional_count: number;
  additional_preview: Array<{ id: string; name: string }> | null;
}

// Type guard to validate RPC response shape
function isClubsRpcResult(data: unknown): data is ClubsRpcResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  // Must have user_id string at minimum
  return typeof obj.user_id === 'string';
}

// ============================================================================
// CANONICAL HOME CLUB GETTER
// ============================================================================

/**
 * Resolves the canonical home club for a user profile.
 * 
 * SCHEMA CONTEXT:
 * Due to legacy schema drift, user_profiles has multiple club-related fields:
 *   - `primary_club_id` (UUID) - CANONICAL: the foreign key to golf_clubs.id
 *   - `home_club_id` (UUID) - LEGACY: older field, may be null even when club is set
 *   - `home_club` (text) - DENORMALIZED: display name for fast reads (header uses this)
 * 
 * PRIORITY ORDER:
 *   1. primary_club_id → join to golf_clubs for authoritative name
 *   2. home_club (text) → fallback if id missing but text exists
 *   3. null → user has no home club set
 * 
 * We do NOT read from home_club_id anymore to avoid confusion.
 */
async function resolveCanonicalHomeClub(
  profileId: string,
  canSeeHomeClub: boolean
): Promise<Club | null> {
  if (!canSeeHomeClub) return null;

  // Fetch both the canonical ID and the denormalized text
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('primary_club_id, home_club')
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    console.error('[resolveCanonicalHomeClub] Query error:', error);
    return null;
  }

  if (!profile) return null;

  const primaryClubId = profile.primary_club_id;
  const homeClubText = profile.home_club;

  // Priority 1: Use primary_club_id if available (canonical)
  if (primaryClubId) {
    const { data: clubRow, error: clubErr } = await supabase
      .from('golf_clubs')
      .select('id, name')
      .eq('id', primaryClubId)
      .maybeSingle();

    if (!clubErr && clubRow) {
      return { id: clubRow.id, name: clubRow.name, isPrimary: true };
    }
    // If join fails but we have the text fallback, use it
    if (homeClubText) {
      return { id: primaryClubId, name: homeClubText, isPrimary: true };
    }
  }

  // Priority 2: Fall back to text-only (legacy accounts)
  if (homeClubText) {
    return { id: 'text-fallback', name: homeClubText, isPrimary: true };
  }

  return null;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Fetches clubs for a user profile.
 * Uses canonical primary_club_id for home club and RPC for additional clubs.
 */
export const useProfileClubs = (
  profileId: string | undefined,
  viewerUserId: string | undefined
): UseProfileClubsResult => {
  const { data, isLoading } = useQuery({
    queryKey: ['profile-clubs', profileId, viewerUserId],
    queryFn: async () => {
      if (!profileId) return { homeClub: null, secondaryClubs: [], isPrivate: false };

      // Fetch visibility setting
      const { data: visibilityRow } = await supabase
        .from('user_profiles')
        .select('home_club_visibility')
        .eq('id', profileId)
        .maybeSingle();

      const isOwner = viewerUserId === profileId;
      const visibility = visibilityRow?.home_club_visibility ?? 'public';
      const canSeeHomeClub = isOwner || visibility === 'public';

      // Resolve home club using canonical getter
      const homeClub = await resolveCanonicalHomeClub(profileId, canSeeHomeClub);

      // Get secondary clubs using RPC (viewer-aware)
      let secondaryClubs: Club[] = [];
      
      // Always pass viewer_id to RPC for proper visibility checks
      // Owner viewing self should always see their clubs
      const { data: rpcResult, error: rpcError } = await supabase.rpc('get_home_clubs_for_user', {
        p_user_profile_id: profileId,
        p_viewer_id: viewerUserId ?? profileId,
      });

      if (rpcError) {
        console.error('[useProfileClubs] RPC error:', rpcError);
      }

      // Parse RPC response with type validation
      if (isClubsRpcResult(rpcResult)) {
        const preview = rpcResult.additional_preview;
        if (Array.isArray(preview)) {
          secondaryClubs = preview
            .filter((c): c is { id: string; name: string } => 
              typeof c?.id === 'string' && typeof c?.name === 'string'
            )
            .map((c) => ({ id: c.id, name: c.name }));
        }
      } else if (rpcResult !== null && process.env.NODE_ENV === 'development') {
        // Log unexpected shape in dev only - helps catch RPC changes early
        console.warn('[useProfileClubs] Unexpected RPC response shape:', rpcResult);
      }

      // Determine if clubs are private (nothing visible and not public)
      const isPrivate = !isOwner && !homeClub && secondaryClubs.length === 0 && visibility !== 'public';

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

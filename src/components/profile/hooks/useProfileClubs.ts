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
 * Profile row shape returned by the single joined query.
 */
interface ProfileClubRow {
  primary_club_id: string | null;
  home_club: string | null;
  home_club_visibility: string | null;
  primary_club: { id: string; name: string } | null;
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
  return typeof obj.user_id === 'string';
}

// ============================================================================
// CANONICAL HOME CLUB GETTER (PURE FUNCTION)
// ============================================================================

/**
 * Resolves the canonical home club from an already-fetched profile row.
 * NO additional network calls - pure function.
 * 
 * SCHEMA CONTEXT:
 * Due to legacy schema drift, user_profiles has multiple club-related fields:
 *   - `primary_club_id` (UUID) - CANONICAL: the foreign key to golf_clubs.id
 *   - `home_club_id` (UUID) - LEGACY: older field, may be null even when club is set
 *   - `home_club` (text) - DENORMALIZED: display name for fast reads (header uses this)
 * 
 * PRIORITY ORDER:
 *   1. primary_club join → use golf_clubs.name from the embedded join
 *   2. primary_club_id + home_club text → fallback if join returned null
 *   3. home_club text only → fallback for legacy accounts without id
 *   4. null → user has no home club set
 * 
 * We do NOT read from home_club_id anymore to avoid confusion.
 */
function resolveCanonicalHomeClubFromRow(
  profile: ProfileClubRow | null,
  canSeeHomeClub: boolean
): Club | null {
  if (!canSeeHomeClub || !profile) return null;

  const { primary_club_id, home_club, primary_club } = profile;

  // Priority 1: Use joined golf_clubs data if available (canonical + authoritative name)
  if (primary_club?.id && primary_club?.name) {
    return { id: primary_club.id, name: primary_club.name, isPrimary: true };
  }

  // Priority 2: Have canonical ID but join failed - use denormalized text
  if (primary_club_id && home_club) {
    return { id: primary_club_id, name: home_club, isPrimary: true };
  }

  // Priority 3: Text-only fallback (legacy accounts without proper club ID)
  if (home_club) {
    return { id: 'text-fallback', name: home_club, isPrimary: true };
  }

  return null;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Fetches clubs for a user profile.
 * Uses canonical primary_club_id for home club and RPC for additional clubs.
 * 
 * PERFORMANCE: 2 network calls total:
 *   1. Single user_profiles query with golf_clubs join
 *   2. RPC for secondary clubs (viewer-aware)
 */
export const useProfileClubs = (
  profileId: string | undefined,
  viewerUserId: string | undefined
): UseProfileClubsResult => {
  const { data, isLoading } = useQuery({
    queryKey: ['profile-clubs', profileId, viewerUserId],
    queryFn: async () => {
      if (!profileId) return { homeClub: null, secondaryClubs: [], isPrivate: false };

      // CALL 1: Single query - profile fields + joined club name
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          primary_club_id,
          home_club,
          home_club_visibility,
          primary_club:golf_clubs!primary_club_id(id, name)
        `)
        .eq('id', profileId)
        .maybeSingle();

      if (profileError) {
        console.error('[useProfileClubs] Profile query error:', profileError);
      }

      const isOwner = viewerUserId === profileId;
      const visibility = profile?.home_club_visibility ?? 'public';
      const canSeeHomeClub = isOwner || visibility === 'public';

      // Resolve home club from already-fetched row (pure function, no extra queries)
      const homeClub = resolveCanonicalHomeClubFromRow(profile as ProfileClubRow | null, canSeeHomeClub);

      // CALL 2: RPC for secondary clubs (viewer-aware)
      let secondaryClubs: Club[] = [];
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc('get_home_clubs_for_user', {
        p_user_profile_id: profileId,
        p_viewer_id: viewerUserId ?? profileId, // Owner viewing self should always see their clubs
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

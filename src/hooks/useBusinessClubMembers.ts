import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClubMember {
  id: string;
  display_name: string | null;
  username: string | null;
  profile_photo_url: string | null;
  eg_handicap_index: number | null;
  show_handicap: boolean | null;
  is_verified_golfer: boolean;
  created_at: string | null;
}

/**
 * Fetches members of a golf club linked to a business profile.
 * Uses the correct relationship: business_accounts.club_id → user_profiles.primary_club_id
 */
export function useBusinessClubMembers(businessId: string | undefined) {
  return useQuery({
    // NOTE: Versioned key to avoid stale cached results from the previous (incorrect)
    // home_club_business_id-based implementation.
    queryKey: ['business-club-members', businessId, 'v2_primary_club_id'],
    enabled: !!businessId,
    queryFn: async () => {
      if (!businessId) return [];

      // Step 1: Get the club_id from the business account
      const { data: business, error: bizError } = await supabase
        .from('business_accounts')
        .select('club_id')
        .eq('id', businessId)
        .maybeSingle();

      if (bizError) {
        console.error('[useBusinessClubMembers] error fetching business:', bizError);
        throw bizError;
      }

      // If no club_id, this business isn't linked to a golf club
      if (!business?.club_id) {
        return [];
      }

      // Step 2: Query users whose primary_club_id matches the business's club_id
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          display_name,
          username,
          profile_photo_url,
          eg_handicap_index,
          show_handicap,
          is_verified_golfer,
          created_at
        `)
        .eq('primary_club_id', business.club_id)
        .eq('is_public', true)
        .order('display_name', { ascending: true });

      if (error) {
        console.error('[useBusinessClubMembers] error:', error);
        throw error;
      }

      return (data || []) as ClubMember[];
    },
    // Keep this fairly fresh; Members is a social surface.
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });
}

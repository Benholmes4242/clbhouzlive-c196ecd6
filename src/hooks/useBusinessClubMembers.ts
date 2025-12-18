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

export function useBusinessClubMembers(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-club-members', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      if (!businessId) return [];

      // Query users who have this business set as their home club
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
        .eq('home_club_id', businessId)
        .eq('is_public', true)
        .order('display_name', { ascending: true });

      if (error) {
        console.error('[useBusinessClubMembers] error:', error);
        throw error;
      }

      return (data || []) as ClubMember[];
    },
    staleTime: 60 * 1000,
  });
}

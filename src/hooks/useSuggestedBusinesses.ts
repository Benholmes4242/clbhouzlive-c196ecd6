import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SuggestedBusiness {
  id: string;
  name: string;
  logo_url: string | null;
  category: string | null;
  location: string | null;
  city: string | null;
  region: string | null;
  sub_country: string | null;
  country: string | null;
  is_verified: boolean;
}

/**
 * Hook to fetch suggested business accounts for the carousel
 * Only shows businesses that have been actively claimed/registered
 * (i.e., have at least one team member or business member)
 * 
 * A business is considered "registered" if:
 * - It has at least one entry in business_team_members, OR
 * - It has at least one entry in business_members
 * 
 * This excludes auto-created business accounts from golf clubs/courses
 * that haven't been claimed by a real business owner.
 */
export function useSuggestedBusinesses() {
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['suggestedBusinesses'],
    queryFn: async () => {
      // Get business IDs that have team members (registered/claimed businesses)
      const { data: teamMemberBusinessIds, error: teamError } = await supabase
        .from('business_team_members')
        .select('business_id');
      
      if (teamError) {
        console.error('[useSuggestedBusinesses] Error fetching team members:', teamError);
      }
      
      // Also check business_members table
      const { data: memberBusinessIds, error: memberError } = await supabase
        .from('business_members')
        .select('business_id');
      
      if (memberError) {
        console.error('[useSuggestedBusinesses] Error fetching business members:', memberError);
      }
      
      // Combine unique business IDs that have at least one member (registered businesses)
      const registeredIds = new Set<string>();
      (teamMemberBusinessIds || []).forEach(r => registeredIds.add(r.business_id));
      (memberBusinessIds || []).forEach(r => registeredIds.add(r.business_id));
      
      console.log('[useSuggestedBusinesses] Found', registeredIds.size, 'registered businesses');
      
      // If no registered businesses, return empty array
      // This prevents showing auto-created business accounts from golf clubs
      if (registeredIds.size === 0) {
        console.log('[useSuggestedBusinesses] No registered businesses found, returning empty');
        return [];
      }

      // Only fetch businesses that have been claimed/registered
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name, logo_url, category, location, city, region, country, is_verified')
        .eq('is_deleted', false)
        .in('id', Array.from(registeredIds))
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('[useSuggestedBusinesses] Error fetching businesses:', error);
        return [];
      }

      console.log('[useSuggestedBusinesses] Returning', data?.length || 0, 'registered businesses');

      return (data || []).map(b => ({
        ...b,
        sub_country: null,
        is_verified: b.is_verified ?? false,
      })) as SuggestedBusiness[];
    },
    staleTime: 60_000,
  });

  return { businesses, isLoading };
}

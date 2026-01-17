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
 */
export function useSuggestedBusinesses() {
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['suggestedBusinesses'],
    queryFn: async () => {
      // First get business IDs that have team members (registered businesses)
      const { data: teamMemberBusinessIds } = await supabase
        .from('business_team_members')
        .select('business_id');
      
      const { data: memberBusinessIds } = await supabase
        .from('business_members')
        .select('business_id');
      
      // Combine unique business IDs that have members
      const registeredIds = new Set<string>();
      (teamMemberBusinessIds || []).forEach(r => registeredIds.add(r.business_id));
      (memberBusinessIds || []).forEach(r => registeredIds.add(r.business_id));
      
      // If no registered businesses, return empty
      if (registeredIds.size === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name, logo_url, category, location, city, region, country, is_verified')
        .eq('is_deleted', false)
        .in('id', Array.from(registeredIds))
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('[useSuggestedBusinesses] Error:', error);
        return [];
      }

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

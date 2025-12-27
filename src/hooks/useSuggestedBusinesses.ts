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
  country: string | null;
  is_verified: boolean;
}

/**
 * Hook to fetch suggested business accounts for the carousel
 * Businesses are always public (no privacy filter)
 */
export function useSuggestedBusinesses() {
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['suggestedBusinesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, name, logo_url, category, location, city, region, country, is_verified')
        .eq('is_deleted', false)
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('[useSuggestedBusinesses] Error:', error);
        return [];
      }

      return (data || []) as SuggestedBusiness[];
    },
    staleTime: 60_000,
  });

  return { businesses, isLoading };
}

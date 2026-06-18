import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessMembership {
  id: string;
  role: 'owner' | 'admin' | 'editor' | 'analyst';
  business: {
    id: string;
    name: string;
    slug: string | null;
    category: string | null;
    location: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    logo_url: string | null;
    is_verified: boolean;
    is_deleted: boolean | null;
  };
}

/**
 * Fetch all businesses the current user is a member of
 */
export function useMyBusinesses(userProfileId?: string) {
  return useQuery({
    queryKey: ['my-businesses', userProfileId],
    enabled: !!userProfileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_members')
        .select(`
          id,
          role,
          business:business_accounts (
            id,
            name,
            slug,
            category,
            location,
            city,
            region,
            country,
            logo_url,
            is_verified,
            is_deleted
          )
        `)
        .eq('user_profile_id', userProfileId);

      if (error) throw error;
      
      // Transform the data to match our interface, filtering out deleted businesses
      return (data ?? []).map(item => ({
        id: item.id,
        role: item.role as BusinessMembership['role'],
        business: item.business as unknown as BusinessMembership['business'],
      })).filter(item => item.business !== null && !item.business.is_deleted);
    },
  });
}

/**
 * Check if user has any businesses they manage
 */
export function useHasBusinesses(userProfileId?: string) {
  const { data, isLoading } = useMyBusinesses(userProfileId);
  return {
    hasBusinesses: (data?.length ?? 0) > 0,
    isLoading,
    count: data?.length ?? 0,
  };
}

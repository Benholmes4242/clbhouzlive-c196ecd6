import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BusinessDirectoryFilters = {
  search?: string;
  category?: string;
  location?: string;
  page?: number;
  pageSize?: number;
};

export function useBusinessDirectory(filters: BusinessDirectoryFilters = {}) {
  const {
    search = '',
    category,
    location,
    page = 1,
    pageSize = 20,
  } = filters;

  return useQuery({
    queryKey: ['business-directory', { search, category, location, page, pageSize }],
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select(
          `
          id,
          username,
          profile_type,
          display_name,
          business_name,
          business_category,
          business_location,
          business_website,
          business_contact_email,
          profile_photo_url,
          header_photo_url,
          is_business_verified
        `,
          { count: 'exact' }
        )
        .eq('profile_type', 'business')
        .order('business_name', { ascending: true });

      if (category) {
        query = query.eq('business_category', category);
      }

      if (location) {
        query = query.ilike('business_location', `%${location}%`);
      }

      if (search.trim()) {
        const s = search.trim();
        query = query.or(
          `business_name.ilike.%${s}%,display_name.ilike.%${s}%,username.ilike.%${s}%`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error('[useBusinessDirectory] error', error);
        throw error;
      }

      return {
        businesses: data || [],
        total: count ?? 0,
        page,
        pageSize,
      };
    },
    staleTime: 60_000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BusinessDirectoryFilters = {
  search?: string;
  category?: string;
  location?: string;
  page?: number;
  pageSize?: number;
};

export interface BusinessDirectoryItem {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  location: string | null;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  is_verified: boolean;
}

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
        .from('business_accounts')
        .select('*', { count: 'exact' })
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      if (search.trim()) {
        const s = search.trim();
        query = query.or(
          `name.ilike.%${s}%,description.ilike.%${s}%`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error('[useBusinessDirectory] error', error);
        throw error;
      }

      // Map to typed interface
      const businesses: BusinessDirectoryItem[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: row.category,
        location: row.location,
        description: row.description,
        website: row.website,
        email: row.email,
        phone: row.phone,
        logo_url: row.logo_url,
        cover_image_url: row.cover_image_url,
        is_verified: row.is_verified ?? false,
      }));

      return {
        businesses,
        total: count ?? 0,
        page,
        pageSize,
      };
    },
    staleTime: 60_000,
  });
}

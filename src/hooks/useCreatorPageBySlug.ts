import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreatorPageData {
  id: string;
  owner_user_id: string;
  display_name: string;
  slug: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  is_verified: boolean;
  is_public: boolean;
  categories: string[] | null;
  social_links: Record<string, string> | null;
  location_city: string | null;
  location_country: string | null;
  created_at: string;
}

/**
 * Fetch a creator page by its slug
 */
export function useCreatorPageBySlug(slug?: string) {
  return useQuery({
    queryKey: ['creator-page', 'slug', slug],
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_pages')
        .select(`
          id,
          owner_user_id,
          display_name,
          slug,
          avatar_url,
          cover_url,
          bio,
          is_verified,
          is_public,
          categories,
          social_links,
          location_city,
          location_country,
          created_at
        `)
        .eq('slug', slug!)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      return data as CreatorPageData;
    },
  });
}

/**
 * Fetch a creator page by its ID
 */
export function useCreatorPageById(id?: string) {
  return useQuery({
    queryKey: ['creator-page', 'id', id],
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_pages')
        .select(`
          id,
          owner_user_id,
          display_name,
          slug,
          avatar_url,
          cover_url,
          bio,
          is_verified,
          is_public,
          categories,
          social_links,
          location_city,
          location_country,
          created_at
        `)
        .eq('id', id!)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as CreatorPageData;
    },
  });
}

/**
 * Get default creator page for a user (legacy redirect support)
 */
export function useDefaultCreatorPage(userId?: string) {
  return useQuery({
    queryKey: ['default-creator-page', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_default_creator_page', {
        p_user_id: userId!,
      });

      if (error) {
        console.error('[useDefaultCreatorPage] error', error);
        return null;
      }

      // RPC returns the slug string or null
      return data as string | null;
    },
  });
}

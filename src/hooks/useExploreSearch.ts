import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';

interface CourseSearchResult {
  type: 'course';
  id: string;
  name: string;
  sub_country: string | null;
  country: string | null;
}

interface RegionSearchResult {
  type: 'region';
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
}

interface ThemeSearchResult {
  type: 'theme';
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
}

export type SearchResult = CourseSearchResult | RegionSearchResult | ThemeSearchResult;

export function useExploreSearch(query: string, enabled = true) {
  const trimmedQuery = query.trim().toLowerCase();
  const debouncedQuery = useDebounce(trimmedQuery, 300);
  const shouldSearch = enabled && debouncedQuery.length >= 2;

  // Search courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['explore-search-courses', debouncedQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, sub_country, country')
        .ilike('name', `%${debouncedQuery}%`)
        .limit(5);

      if (error) throw error;
      return (data || []).map(c => ({
        type: 'course' as const,
        id: c.id,
        name: c.name,
        sub_country: c.sub_country,
        country: c.country,
      }));
    },
    enabled: shouldSearch,
    staleTime: 30000,
  });

  // Search regions
  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ['explore-search-regions', debouncedQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explore_regions')
        .select('id, slug, title, subtitle')
        .ilike('title', `%${debouncedQuery}%`)
        .limit(5);

      if (error) throw error;
      return (data || []).map(r => ({
        type: 'region' as const,
        id: r.id,
        slug: r.slug,
        title: r.title,
        subtitle: r.subtitle,
      }));
    },
    enabled: shouldSearch,
    staleTime: 30000,
  });

  // Search themes
  const { data: themes, isLoading: themesLoading } = useQuery({
    queryKey: ['explore-search-themes', debouncedQuery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explore_themes')
        .select('id, slug, title, subtitle')
        .ilike('title', `%${debouncedQuery}%`)
        .limit(5);

      if (error) throw error;
      return (data || []).map(t => ({
        type: 'theme' as const,
        id: t.id,
        slug: t.slug,
        title: t.title,
        subtitle: t.subtitle,
      }));
    },
    enabled: shouldSearch,
    staleTime: 30000,
  });

  const isLoading = coursesLoading || regionsLoading || themesLoading;
  const hasResults = (courses?.length || 0) > 0 || (regions?.length || 0) > 0 || (themes?.length || 0) > 0;

  return {
    courses: courses || [],
    regions: regions || [],
    themes: themes || [],
    isLoading,
    hasResults,
    isSearching: shouldSearch,
  };
}

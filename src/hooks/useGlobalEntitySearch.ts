import { useQuery, useQueries } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { searchAnalytics } from '@/utils/searchAnalytics';

// Types for search results
export interface PersonResult {
  id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  verified?: boolean;
  home_club_name?: string | null;
  type: 'user';
}

export interface ClubResult {
  id: string;
  name: string;
  slug?: string;
  logo_url: string | null;
  city?: string | null;
  country: string;
  region?: string | null;
  global_rank?: number | null;
  type: 'course';
}

export interface PageResult {
  id: string;
  name: string;
  slug?: string;
  logo_url: string | null;
  verified?: boolean;
  type: 'page';
}

export interface TrendingItem {
  label: string;
  type: 'people' | 'clubs' | 'pages';
  id?: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

export interface GlobalSearchResults {
  people: PersonResult[];
  clubs: ClubResult[];
  pages: PageResult[];
  recent: RecentSearch[];
  trending: TrendingItem[];
  isLoading: boolean;
  error?: Error | null;
}

export interface UseGlobalEntitySearchProps {
  query: string;
  enabled?: boolean;
  limits?: {
    people?: number;
    clubs?: number;
    pages?: number;
  };
}

// Search functions with optimized queries and limits
const searchPeople = async (query: string, limit: number = 6): Promise<PersonResult[]> => {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      display_name,
      username,
      profile_photo_url,
      home_club,
      is_public
    `)
    .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
    .eq('is_public', true)
    .order('display_name')
    .limit(Math.min(limit, 8)); // Performance: cap each section at 8 items

  if (error) {
    console.error('Error searching people:', error);
    throw new Error('Failed to search people');
  }

  return (data || []).map(user => ({
    id: user.id,
    display_name: user.display_name || user.username || 'Anonymous User',
    username: user.username,
    avatar_url: user.profile_photo_url,
    home_club_name: user.home_club,
    type: 'user' as const
  }));
};

const searchClubs = async (query: string, limit: number = 6): Promise<ClubResult[]> => {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('golf_courses')
    .select(`
      id,
      name,
      country,
      region,
      thumbnail_image,
      global_rank
    `)
    .ilike('name', `%${query}%`)
    .order('global_rank', { ascending: true, nullsFirst: false })
    .limit(Math.min(limit, 8)); // Performance: cap each section at 8 items

  if (error) {
    console.error('Error searching clubs:', error);
    throw new Error('Failed to search clubs');
  }

  return (data || []).map(course => ({
    id: course.id,
    name: course.name,
    logo_url: course.thumbnail_image,
    country: course.country,
    region: course.region,
    global_rank: course.global_rank,
    type: 'course' as const
  }));
};

const searchPages = async (query: string, limit: number = 6): Promise<PageResult[]> => {
  // For now, return empty array as pages/channels aren't implemented
  // This can be extended when pages/channels are added to the database
  return [];
};

// Get recent searches from localStorage
const getRecentSearches = (): RecentSearch[] => {
  try {
    const stored = localStorage.getItem('recent_searches');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.slice(0, 8); // Keep only 8 most recent
    }
  } catch (error) {
    console.error('Error loading recent searches:', error);
  }
  return [];
};

// Get trending items (popular courses)
const getTrendingItems = async (): Promise<TrendingItem[]> => {
  try {
    const { data, error } = await supabase
      .from('golf_courses')
      .select('id, name, global_rank')
      .not('global_rank', 'is', null)
      .order('global_rank', { ascending: true })
      .limit(8);

    if (error) throw error;

    return (data || []).map(course => ({
      label: course.name,
      type: 'clubs' as const,
      id: course.id
    }));
  } catch (error) {
    console.error('Error loading trending items:', error);
    return [];
  }
};

// Main hook
export const useGlobalEntitySearch = ({
  query,
  enabled = true,
  limits = { people: 6, clubs: 6, pages: 6 }
}: UseGlobalEntitySearchProps): GlobalSearchResults => {
  // Track query changes for analytics
  const prevQuery = useRef<string>('');
  useEffect(() => {
    if (query !== prevQuery.current && query.trim()) {
      searchAnalytics.searchQueryChanged(query);
      prevQuery.current = query;
    }
  }, [query]);

  const hasQuery = query.trim().length > 0;
  const normalizedQuery = query.trim().toLowerCase();

  // Get recent searches (doesn't need React Query since it's localStorage)
  const recent = getRecentSearches();

  // Get trending items
  const trendingQuery = useQuery({
    queryKey: ['global-search', 'trending'],
    queryFn: getTrendingItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v4+)
    enabled: enabled && !hasQuery
  });

  // Individual search queries - more predictable than useQueries
  const peopleQuery = useQuery({
    queryKey: ['global-search', 'people', normalizedQuery],
    queryFn: () => searchPeople(normalizedQuery, limits.people || 6),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && hasQuery
  });

  const clubsQuery = useQuery({
    queryKey: ['global-search', 'clubs', normalizedQuery],
    queryFn: () => searchClubs(normalizedQuery, limits.clubs || 6),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && hasQuery
  });

  const pagesQuery = useQuery({
    queryKey: ['global-search', 'pages', normalizedQuery],
    queryFn: () => searchPages(normalizedQuery, limits.pages || 6),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && hasQuery
  });

  // Extract results
  const people = peopleQuery.data || [];
  const clubs = clubsQuery.data || [];
  const pages = pagesQuery.data || [];

  // Loading state
  const isLoading = hasQuery 
    ? (peopleQuery.isLoading || clubsQuery.isLoading || pagesQuery.isLoading)
    : trendingQuery.isLoading;

  // Error handling
  const error = hasQuery
    ? (peopleQuery.error || clubsQuery.error || pagesQuery.error)
    : trendingQuery.error;

  const trending = trendingQuery.data || [];

  const allResultsEmpty = people.length === 0 && clubs.length === 0 && pages.length === 0;
  
  // Track no results for analytics
  useEffect(() => {
    if (query.trim() && !isLoading && allResultsEmpty) {
      searchAnalytics.searchNoResults(query);
    }
  }, [query, isLoading, allResultsEmpty]);

  return {
    people,
    clubs,
    pages,
    recent,
    trending,
    isLoading,
    error: error || null
  };
};

// Utility functions for highlighting
export const highlightText = (text: string, query: string): string => {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

export const getMatchPositions = (text: string, query: string): Array<{ start: number; end: number }> => {
  if (!query.trim()) return [];
  
  const matches: Array<{ start: number; end: number }> = [];
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length
    });
  }
  
  return matches;
};

// Save recent search utility
export const saveRecentSearch = (query: string) => {
  if (!query.trim()) return;

  const newSearch: RecentSearch = {
    id: Date.now().toString(),
    query: query.trim(),
    timestamp: Date.now()
  };

  const existing = getRecentSearches();
  const updated = [
    newSearch,
    ...existing.filter(s => s.query.toLowerCase() !== query.trim().toLowerCase())
  ].slice(0, 8);

  localStorage.setItem('recent_searches', JSON.stringify(updated));
};

// Clear recent searches utility
export const clearRecentSearches = () => {
  localStorage.removeItem('recent_searches');
};
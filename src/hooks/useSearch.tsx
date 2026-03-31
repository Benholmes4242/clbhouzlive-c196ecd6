import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  type: 'user' | 'course' | 'business';
  title: string;
  subtitle: string;
  image?: string;
  username?: string;
  verified?: boolean;
}

interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [popularClubs, setPopularClubs] = useState<SearchResult[]>([]);
  
  const debouncedQuery = useDebounce(query, 200);

  const loadRecentSearches = () => {
    const stored = localStorage.getItem('recent_searches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed.slice(0, 5)); // Keep only 5 most recent
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  };

  const loadPopularClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, country, region, thumbnail_image, global_rank')
        .not('global_rank', 'is', null)
        .order('global_rank', { ascending: true })
        .limit(8);

      if (error) throw error;

      const clubResults = (data || []).map(course => ({
        id: course.id,
        type: 'course' as const,
        title: course.name,
        subtitle: `${course.region || course.country}${course.global_rank ? ` • #${course.global_rank}` : ''}`,
        image: course.thumbnail_image || undefined
      }));

      setPopularClubs(clubResults);
    } catch (error) {
      console.error('Error loading popular clubs:', error);
    }
  };

  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      query: searchQuery.trim(),
      timestamp: Date.now()
    };

    const updatedSearches = [
      newSearch,
      ...recentSearches.filter(s => s.query !== searchQuery.trim())
    ].slice(0, 5);

    setRecentSearches(updatedSearches);
    localStorage.setItem('recent_searches', JSON.stringify(updatedSearches));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  const searchUsers = async (searchTerm: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, username, home_club, profile_photo_url')
      .or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
      .limit(6);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return (data || []).map(user => ({
      id: user.id,
      type: 'user' as const,
      title: user.display_name || user.username || 'Anonymous User',
      subtitle: user.home_club ? `${user.home_club}` : 'No home club set',
      username: user.username || user.id,
      image: user.profile_photo_url || undefined
    }));
  };

  const searchCourses = async (searchTerm: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('golf_courses')
      .select('id, name, country, region, thumbnail_image, global_rank')
      .ilike('name', `%${searchTerm}%`)
      .limit(6);

    if (error) {
      console.error('Error searching courses:', error);
      return [];
    }

    return (data || []).map(course => ({
      id: course.id,
      type: 'course' as const,
      title: course.name,
      subtitle: `${course.region || course.country}${course.global_rank ? ` • #${course.global_rank}` : ''}`,
      image: course.thumbnail_image || undefined
    }));
  };

  const searchBusinesses = async (searchTerm: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('business_accounts')
      .select('id, name, slug, city, country, location, logo_url, is_verified')
      .ilike('name', `%${searchTerm}%`)
      .eq('is_deleted', false)
      .limit(6);

    if (error) {
      console.error('Error searching businesses:', error);
      return [];
    }

    // Format subtitle as "City, Country" only - no category, no full address
    const formatCityCountry = (business: { city?: string | null; country?: string | null; location?: string | null }) => {
      // Prefer structured city/country fields
      if (business.city || business.country) {
        return [business.city, business.country].filter(Boolean).join(', ');
      }
      // Fallback: parse location string to get last two parts (city, country)
      if (business.location) {
        const parts = business.location.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
        }
        return parts[0] ?? '';
      }
      return '';
    };

    return (data || []).map(business => ({
      id: business.id,
      type: 'business' as const,
      title: business.name,
      subtitle: formatCityCountry(business) || 'Business Profile',
      image: business.logo_url || undefined,
      verified: business.is_verified || false
    }));
  };

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const [userResults, courseResults, businessResults] = await Promise.all([
        searchUsers(searchTerm),
        searchCourses(searchTerm),
        searchBusinesses(searchTerm)
      ]);

      // Combine results: people, clubs/courses, then businesses
      const allResults = [...userResults, ...courseResults, ...businessResults];
      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadRecentSearches();
    loadPopularClubs();
  }, []);

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const executeRecentSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
  };

  return {
    query,
    setQuery,
    results,
    loading,
    recentSearches,
    popularClubs,
    clearResults: () => setResults([]),
    saveRecentSearch,
    clearRecentSearches,
    executeRecentSearch
  };
};
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  type: 'user' | 'course';
  title: string;
  subtitle: string;
  image?: string;
  username?: string;
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

  // Load recent searches and popular clubs on mount
  useMemo(() => {
    loadRecentSearches();
    loadPopularClubs();
  }, []);

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
      .eq('is_public', true)
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

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const [userResults, courseResults] = await Promise.all([
        searchUsers(searchTerm),
        searchCourses(searchTerm)
      ]);

      // Combine results with users first
      const allResults = [...userResults, ...courseResults];
      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to trigger search when debounced query changes
  useMemo(() => {
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
import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface MediaSearchResult {
  id: string;
  type: 'media';
  title: string;
  subtitle: string;
  image?: string;
}

interface RecentMediaSearch {
  id: string;
  query: string;
  timestamp: number;
}

export const useMediaSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentMediaSearch[]>([]);
  const [trendingQueries, setTrendingQueries] = useState<string[]>([]);
  
  const debouncedQuery = useDebounce(query, 200);

  const loadRecentSearches = () => {
    const stored = localStorage.getItem('recent_media_searches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed.slice(0, 5)); // Keep only 5 most recent
      } catch (error) {
        console.error('Error loading recent media searches:', error);
      }
    }
  };

  const loadTrendingQueries = async () => {
    // TODO: Replace with actual API endpoint when available
    // For now, use mock trending queries
    const mockTrending = [
      'golf swing tips',
      'putting techniques', 
      'course highlights',
      'trick shots',
      'golf humor'
    ];
    setTrendingQueries(mockTrending);
  };

  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const newSearch: RecentMediaSearch = {
      id: Date.now().toString(),
      query: searchQuery.trim(),
      timestamp: Date.now()
    };

    const updatedSearches = [
      newSearch,
      ...recentSearches.filter(s => s.query !== searchQuery.trim())
    ].slice(0, 5);

    setRecentSearches(updatedSearches);
    localStorage.setItem('recent_media_searches', JSON.stringify(updatedSearches));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_media_searches');
  };

  const performMediaSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Replace with actual media search API when available
      // For now, return empty results as this will filter the existing grid
      setResults([]);
    } catch (error) {
      console.error('Media search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadRecentSearches();
    loadTrendingQueries();
  }, []);

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    performMediaSearch(debouncedQuery);
  }, [debouncedQuery, performMediaSearch]);

  const executeRecentSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    performMediaSearch(searchQuery);
  };

  const executeTrendingSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    saveRecentSearch(searchQuery);
    performMediaSearch(searchQuery);
  };

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    loading,
    recentSearches,
    trendingQueries,
    clearResults: () => setResults([]),
    saveRecentSearch,
    clearRecentSearches,
    executeRecentSearch,
    executeTrendingSearch
  };
};
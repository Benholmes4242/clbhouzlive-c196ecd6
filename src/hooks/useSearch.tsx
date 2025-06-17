
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

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  const searchUsers = async (searchTerm: string): Promise<SearchResult[]> => {
    console.log('Searching users for term:', searchTerm);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, username, home_club, profile_photo_url')
      .or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,home_club.ilike.%${searchTerm}%`)
      .eq('is_public', true)
      .limit(10);

    console.log('User search query result:', { data, error });

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    const userResults = (data || []).map(user => ({
      id: user.id,
      type: 'user' as const,
      title: user.display_name || user.username || 'Anonymous User',
      subtitle: user.home_club ? `Home Club: ${user.home_club}` : 'No home club set',
      username: user.username || user.id,
      image: user.profile_photo_url || undefined
    }));

    console.log('Processed user results:', userResults);
    return userResults;
  };

  const searchCourses = async (searchTerm: string): Promise<SearchResult[]> => {
    console.log('Searching courses for term:', searchTerm);
    
    const { data, error } = await supabase
      .from('golf_courses')
      .select('id, name, country, region, thumbnail_image')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    console.log('Course search query result:', { data, error });

    if (error) {
      console.error('Error searching courses:', error);
      return [];
    }

    const courseResults = (data || []).map(course => ({
      id: course.id,
      type: 'course' as const,
      title: course.name,
      subtitle: `${course.region || course.country}`,
      image: course.thumbnail_image || undefined
    }));

    console.log('Processed course results:', courseResults);
    return courseResults;
  };

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    console.log('Performing search for:', searchTerm);
    setLoading(true);
    
    try {
      const [userResults, courseResults] = await Promise.all([
        searchUsers(searchTerm),
        searchCourses(searchTerm)
      ]);

      console.log('All search results:', { userResults, courseResults });

      // Combine and limit total results
      const allResults = [...userResults, ...courseResults].slice(0, 20);
      console.log('Final combined results:', allResults);
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

  return {
    query,
    setQuery,
    results,
    loading,
    clearResults: () => setResults([])
  };
};

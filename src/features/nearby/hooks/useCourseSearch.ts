import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

export interface GolfCourse {
  id: string;
  name: string;
  country: string;
  region?: string;
}

export const useCourseSearch = (searchTerm: string) => {
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 200);

  useEffect(() => {
    const searchCourses = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setCourses([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('golf_courses')
          .select('id, name, country, region')
          .ilike('name', `%${debouncedSearch}%`)
          .limit(10);

        if (error) throw error;
        setCourses(data || []);
      } catch (error) {
        console.error('Error searching courses:', error);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchCourses();
  }, [debouncedSearch]);

  return { courses, isLoading };
};

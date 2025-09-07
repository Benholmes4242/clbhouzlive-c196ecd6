import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  name: string;
  country: string;
  sub_country?: string;
  region: string;
  thumbnail_image?: string;
  global_rank?: number;
  regional_rank?: number;
  usa_rank?: number;
}

interface SearchResult extends Course {
  rating?: number;
  played?: boolean;
}

interface UseCourseSearchOptions {
  debounceMs?: number;
  limit?: number;
  userId?: string;
}

export function useCourseSearch(query: string, options: UseCourseSearchOptions = {}) {
  const { debounceMs = 250, limit = 20, userId } = options;
  const [data, setData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        // Search courses
        const { data: courses, error: coursesError } = await supabase
          .from('golf_courses')
          .select('id, name, country, sub_country, region, thumbnail_image, global_rank, regional_rank, usa_rank')
          .ilike('name', `%${query}%`)
          .limit(limit);

        if (coursesError) throw coursesError;

        if (!courses) {
          setData([]);
          setLoading(false);
          return;
        }

        // If userId provided, fetch user's ratings and played status
        let enrichedResults: SearchResult[] = courses;

        if (userId) {
          const courseIds = courses.map(c => c.id);
          
          // Get user ratings
          const { data: ratings } = await supabase
            .from('course_ratings')
            .select('course_id, rating')
            .eq('user_id', userId)
            .in('course_id', courseIds);

          // Get played status
          const { data: playedCourses } = await supabase
            .from('user_top100_courses')
            .select('course_id')
            .eq('user_id', userId)
            .eq('played', true)
            .in('course_id', courseIds);

          const ratingsMap = new Map(ratings?.map(r => [r.course_id, r.rating]) || []);
          const playedSet = new Set(playedCourses?.map(p => p.course_id) || []);

          enrichedResults = courses.map(course => ({
            ...course,
            rating: ratingsMap.get(course.id),
            played: playedSet.has(course.id)
          }));
        }

        setData(enrichedResults);
      } catch (err) {
        console.error('Error searching courses:', err);
        setError('Failed to search courses');
        setData([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, limit, userId]);

  return { data, loading, error };
}

export async function getSuggestions(userId?: string): Promise<SearchResult[]> {
  if (!userId) return [];

  try {
    // Get recently played courses
    const { data: recentlyPlayed } = await supabase
      .from('user_top100_courses')
      .select(`
        course_id,
        golf_courses!inner(
          id, name, country, sub_country, region, thumbnail_image,
          global_rank, regional_rank, usa_rank
        )
      `)
      .eq('user_id', userId)
      .eq('played', true)
      .order('played_date', { ascending: false })
      .limit(5);

    // Get highest rated courses by user
    const { data: highestRated } = await supabase
      .from('course_ratings')
      .select(`
        course_id, rating,
        golf_courses!inner(
          id, name, country, sub_country, region, thumbnail_image,
          global_rank, regional_rank, usa_rank
        )
      `)
      .eq('user_id', userId)
      .order('rating', { ascending: false })
      .limit(5);

    const suggestions: SearchResult[] = [];
    const allCourseIds: string[] = [];

    // Collect all course IDs for rating lookup
    if (recentlyPlayed) {
      allCourseIds.push(...recentlyPlayed.map(item => item.golf_courses.id));
    }
    if (highestRated) {
      allCourseIds.push(...highestRated.map(item => item.golf_courses.id));
    }

    // Get all ratings for these courses in one query
    const { data: allRatings } = await supabase
      .from('course_ratings')
      .select('course_id, rating')
      .eq('user_id', userId)
      .in('course_id', allCourseIds);

    const ratingsMap = new Map(allRatings?.map(r => [r.course_id, r.rating]) || []);

    // Add recently played with their ratings
    if (recentlyPlayed) {
      recentlyPlayed.forEach(item => {
        const course = item.golf_courses;
        suggestions.push({
          ...course,
          played: true,
          rating: ratingsMap.get(course.id)
        });
      });
    }

    // Add highest rated (avoid duplicates)
    if (highestRated) {
      const existingIds = new Set(suggestions.map(s => s.id));
      highestRated.forEach(item => {
        const course = item.golf_courses;
        if (!existingIds.has(course.id)) {
          suggestions.push({
            ...course,
            rating: item.rating
          });
        }
      });
    }

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}
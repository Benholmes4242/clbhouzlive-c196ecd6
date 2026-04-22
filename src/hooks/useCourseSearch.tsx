import { useState, useEffect, useRef } from 'react';
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

  // Guard against state updates on unmounted component (Fix 5: race conditions)
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!mountedRef.current) return;
      setLoading(true);
      setError(null);

      try {
        // Search courses
        const { data: courses, error: coursesError } = await supabase
          .from('golf_courses')
          .select('id, name, country, sub_country, region, thumbnail_image, global_rank, regional_rank, usa_rank')
          .ilike('name', `%${query}%`)
          .limit(limit);

        if (!mountedRef.current) return;
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
          
          // Get user ratings (ratings-only: rated = played)
          const { data: ratings } = await supabase
            .from('course_ratings')
            .select('course_id, rating')
            .eq('user_id', userId)
            .in('course_id', courseIds);

          if (!mountedRef.current) return;

          const ratingsMap = new Map(ratings?.map(r => [r.course_id, r.rating]) || []);

          // In ratings-only system, played = has rating
          enrichedResults = courses.map(course => ({
            ...course,
            rating: ratingsMap.get(course.id),
            played: ratingsMap.has(course.id)
          }));
        }

        if (mountedRef.current) setData(enrichedResults);
      } catch (err) {
        console.error('Error searching courses:', err);
        if (mountedRef.current) {
          setError('Failed to search courses');
          setData([]);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, limit, userId]);

  return { data, loading, error };
}

/**
 * Ratings-only: suggestions based on course_ratings
 */
export async function getSuggestions(userId?: string): Promise<SearchResult[]> {
  if (!userId) return [];

  try {
    const { compareOwnRatings } = await import('@/lib/sortCoursesByRating');

    // Get recently rated courses (ratings-only: most recent ratings)
    const { data: recentlyRated } = await supabase
      .from('course_ratings')
      .select(`
        course_id, rating, created_at, review_date,
        design_score, condition_score, clubhouse_score, facilities_score,
        golf_courses!inner(
          id, name, country, sub_country, region, thumbnail_image,
          global_rank, regional_rank, usa_rank
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get highest rated courses by user
    // Fetch a small overshoot then apply canonical own-rating chain client-side.
    const { data: highestRatedRaw } = await supabase
      .from('course_ratings')
      .select(`
        course_id, rating, review_date, created_at,
        design_score, condition_score, clubhouse_score, facilities_score,
        golf_courses!inner(
          id, name, country, sub_country, region, thumbnail_image,
          global_rank, regional_rank, usa_rank
        )
      `)
      .eq('user_id', userId)
      .order('rating', { ascending: false })
      .limit(20);

    const highestRated = [...((highestRatedRaw || []) as any[])]
      .sort((a: any, b: any) => compareOwnRatings(
        {
          course_id: a.course_id,
          rating: a.rating,
          design_score: a.design_score,
          condition_score: a.condition_score,
          clubhouse_score: a.clubhouse_score,
          facilities_score: a.facilities_score,
          review_date: a.review_date ?? a.created_at,
        },
        {
          course_id: b.course_id,
          rating: b.rating,
          design_score: b.design_score,
          condition_score: b.condition_score,
          clubhouse_score: b.clubhouse_score,
          facilities_score: b.facilities_score,
          review_date: b.review_date ?? b.created_at,
        },
        'desc'
      ))
      .slice(0, 5);

    const suggestions: SearchResult[] = [];

    // Add recently rated
    if (recentlyRated) {
      recentlyRated.forEach(item => {
        const course = item.golf_courses;
        suggestions.push({
          ...course,
          played: true,
          rating: item.rating
        });
      });
    }

    // Add highest rated (avoid duplicates)
    if (highestRated) {
      const existingIds = new Set(suggestions.map(s => s.id));
      highestRated.forEach((item: any) => {
        const course = item.golf_courses;
        if (!existingIds.has(course.id)) {
          suggestions.push({
            ...course,
            played: true,
            rating: item.rating
          });
        }
      });
    }

    return suggestions.slice(0, 8);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
}
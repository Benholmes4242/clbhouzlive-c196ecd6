import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Top100MapScope = 'global' | 'gb-i' | 'usa' | 'europe';

export type CourseJourneyStatus = 'played' | 'want_to_play' | 'none';

export interface Top100MapCourse {
  id: string;
  name: string;
  country: string | null;
  sub_country: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  rank: number | null;
  list_slug: Top100MapScope;
  user_has_rated: boolean;
  user_rating: number | null;
  journey_status: CourseJourneyStatus;
}

export function useTop100MapCourses(scope: Top100MapScope, userId?: string) {
  return useQuery({
    queryKey: ['top100-map-courses', scope, userId],
    queryFn: async (): Promise<Top100MapCourse[]> => {
      console.log('[Top100Map] DEBUG - Query starting with scope:', scope);
      
      // 1) Find the list matching the scope
      const { data: lists, error: listsError } = await supabase
        .from('top100_lists')
        .select('id, slug')
        .eq('slug', scope)
        .eq('is_active', true);

      console.log('[Top100Map] DEBUG - Lists query result:', { lists, error: listsError });
      
      if (listsError) throw listsError;
      if (!lists || lists.length === 0) {
        console.log('[Top100Map] ❌ No list found for scope:', scope);
        return [];
      }

      const listId = lists[0].id;

      console.log('[Top100Map] ✅ Found list:', lists[0], 'with ID:', listId);

      // 2) Get course memberships + golf_courses data
      const { data: memberships, error: membershipsError } = await supabase
        .from('course_top100_memberships')
        .select(`
          course_id,
          rank,
          golf_courses:course_id (
            id,
            name,
            country,
            sub_country,
            region,
            latitude,
            longitude
          )
        `)
        .eq('list_id', listId);

      if (membershipsError) throw membershipsError;

      // 3) Get user's rated courses if userId provided
      let ratedCoursesMap = new Map<string, number>();
      let wantToPlaySet = new Set<string>();
      
      if (userId) {
        // Fetch ratings
        const { data: ratings, error: ratingsError } = await supabase
          .from('course_ratings')
        .select('course_id, rating')
        .eq('user_id', userId)
        .eq('is_mock', false)
        .not('rating', 'is', null);

        if (!ratingsError && ratings) {
          ratings.forEach((r: any) => {
            ratedCoursesMap.set(r.course_id, r.rating);
          });
        }

        // Fetch want to play (shortlists with list_key = 'want_to_play')
        const { data: shortlists, error: shortlistError } = await supabase
          .from('course_shortlists')
          .select('course_id, list_key')
          .eq('user_id', userId)
          .in('list_key', ['want_to_play', 'wishlist']);

        if (!shortlistError && shortlists) {
          shortlists.forEach((s: any) => {
            wantToPlaySet.add(s.course_id);
          });
        }
      }

      // 4) Transform and filter for courses with coordinates
      const coursesMap = new Map<string, Top100MapCourse>();
      let skippedNoCoords = 0;

      (memberships || []).forEach((m: any) => {
        const course = m.golf_courses;
        if (!course || course.latitude == null || course.longitude == null) {
          skippedNoCoords++;
          return;
        }

        const existingCourse = coursesMap.get(course.id);
        const currentRank = m.rank || 9999;

        // Keep the best (lowest) rank if duplicate
        if (!existingCourse || (existingCourse.rank || 9999) > currentRank) {
          const userRating = ratedCoursesMap.get(course.id);
          const hasRated = ratedCoursesMap.has(course.id);
          const wantsToPlay = wantToPlaySet.has(course.id);
          
          // Determine journey status
          let journeyStatus: CourseJourneyStatus = 'none';
          if (hasRated) {
            journeyStatus = 'played';
          } else if (wantsToPlay) {
            journeyStatus = 'want_to_play';
          }
          
          coursesMap.set(course.id, {
            id: course.id,
            name: course.name,
            country: course.country,
            sub_country: course.sub_country,
            region: course.region,
            latitude: course.latitude,
            longitude: course.longitude,
            rank: m.rank,
            list_slug: scope,
            user_has_rated: hasRated,
            user_rating: userRating || null,
            journey_status: journeyStatus,
          });
        }
      });

      const finalCourses = Array.from(coursesMap.values());
      
      return finalCourses;
    },
    staleTime: 60_000,
  });
}

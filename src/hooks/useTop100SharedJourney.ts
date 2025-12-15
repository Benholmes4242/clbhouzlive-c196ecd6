import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SharedTop100Course {
  course_id: string;
  course_name: string;
  country: string | null;
  sub_country: string | null;
  lists: { slug: string; name: string }[];
  first_played_by_me?: string | null;
  first_played_by_them?: string | null;
  last_played_by_me?: string | null;
  last_played_by_them?: string | null;
}

export interface SharedTop100Journey {
  shared_count: number;
  shared_courses: SharedTop100Course[];
  my_unique_count: number;
  their_unique_count: number;
}

export function useTop100SharedJourney(myUserId?: string | null, otherUserId?: string | null) {
  return useQuery<SharedTop100Journey>({
    queryKey: ['top100-shared-journey', myUserId, otherUserId],
    enabled: !!myUserId && !!otherUserId && myUserId !== otherUserId,
    queryFn: async () => {
      if (!myUserId || !otherUserId || myUserId === otherUserId) {
        return {
          shared_count: 0,
          shared_courses: [],
          my_unique_count: 0,
          their_unique_count: 0,
        };
      }

      // Fetch both users' rated courses (ratings-only source)
      const { data: ratings, error: ratingsError } = await supabase
        .from('course_ratings')
        .select('user_id, course_id, created_at, updated_at')
        .in('user_id', [myUserId, otherUserId]);

      if (ratingsError) throw ratingsError;

      // Get Top 100 course IDs to filter
      const ratedCourseIds = (ratings || []).map(r => r.course_id);
      const { data: top100Memberships } = await supabase
        .from('course_top100_memberships')
        .select('course_id')
        .in('course_id', ratedCourseIds);

      const top100CourseIds = new Set((top100Memberships || []).map(m => m.course_id));

      // Build sets of course IDs per user (filtered to Top 100 only)
      const myCourses = new Map<string, { first: string | null; last: string | null }>();
      const theirCourses = new Map<string, { first: string | null; last: string | null }>();

      for (const rating of (ratings || [])) {
        if (!top100CourseIds.has(rating.course_id)) continue;
        
        const targetMap = rating.user_id === myUserId ? myCourses : theirCourses;
        const existing = targetMap.get(rating.course_id);
        const activityDate = rating.updated_at || rating.created_at;
        
        if (!existing) {
          targetMap.set(rating.course_id, {
            first: activityDate,
            last: activityDate,
          });
        } else {
          // Update first and last if needed
          if (activityDate) {
            if (!existing.first || activityDate < existing.first) {
              existing.first = activityDate;
            }
            if (!existing.last || activityDate > existing.last) {
              existing.last = activityDate;
            }
          }
        }
      }

      // Calculate shared and unique
      const sharedCourseIds = Array.from(myCourses.keys()).filter(courseId => 
        theirCourses.has(courseId)
      );
      const myUniqueCourseIds = Array.from(myCourses.keys()).filter(courseId => 
        !theirCourses.has(courseId)
      );
      const theirUniqueCourseIds = Array.from(theirCourses.keys()).filter(courseId => 
        !myCourses.has(courseId)
      );

      if (sharedCourseIds.length === 0) {
        return {
          shared_count: 0,
          shared_courses: [],
          my_unique_count: myUniqueCourseIds.length,
          their_unique_count: theirUniqueCourseIds.length,
        };
      }

      // Fetch course + list membership details for shared courses
      const { data: courseData, error: courseError } = await supabase
        .from('course_top100_memberships')
        .select(`
          course_id,
          top100_lists!inner (
            slug,
            name
          ),
          golf_courses!inner (
            id,
            name,
            country,
            sub_country
          )
        `)
        .in('course_id', sharedCourseIds);

      if (courseError) throw courseError;

      // Group by course
      const courseMap = new Map<string, SharedTop100Course>();
      for (const item of courseData || []) {
        if (!courseMap.has(item.course_id)) {
          const myDates = myCourses.get(item.course_id);
          const theirDates = theirCourses.get(item.course_id);

          courseMap.set(item.course_id, {
            course_id: item.course_id,
            course_name: (item as any).golf_courses.name,
            country: (item as any).golf_courses.country,
            sub_country: (item as any).golf_courses.sub_country,
            lists: [],
            first_played_by_me: myDates?.first || null,
            last_played_by_me: myDates?.last || null,
            first_played_by_them: theirDates?.first || null,
            last_played_by_them: theirDates?.last || null,
          });
        }

        const course = courseMap.get(item.course_id)!;
        course.lists.push({
          slug: (item as any).top100_lists.slug,
          name: (item as any).top100_lists.name,
        });
      }

      return {
        shared_count: sharedCourseIds.length,
        shared_courses: Array.from(courseMap.values()),
        my_unique_count: myUniqueCourseIds.length,
        their_unique_count: theirUniqueCourseIds.length,
      };
    },
    staleTime: 60 * 1000,
  });
}

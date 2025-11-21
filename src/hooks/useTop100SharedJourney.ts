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

      // Fetch both users' Top 100 activity
      const { data: activities, error: activitiesError } = await supabase
        .from('user_course_activity')
        .select('user_id, course_id, last_played_at')
        .eq('is_top100', true)
        .in('user_id', [myUserId, otherUserId]);

      if (activitiesError) throw activitiesError;

      // Build sets of course IDs per user
      const myCourses = new Map<string, { first: string | null; last: string | null }>();
      const theirCourses = new Map<string, { first: string | null; last: string | null }>();

      for (const activity of activities || []) {
        const targetMap = activity.user_id === myUserId ? myCourses : theirCourses;
        const existing = targetMap.get(activity.course_id);
        
        if (!existing) {
          targetMap.set(activity.course_id, {
            first: activity.last_played_at,
            last: activity.last_played_at,
          });
        } else {
          // Update first and last if needed
          if (activity.last_played_at) {
            if (!existing.first || activity.last_played_at < existing.first) {
              existing.first = activity.last_played_at;
            }
            if (!existing.last || activity.last_played_at > existing.last) {
              existing.last = activity.last_played_at;
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

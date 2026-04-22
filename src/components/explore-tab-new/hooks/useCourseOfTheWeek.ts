import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseOfTheWeek {
  course_id: string;
  course_name: string;
  country: string;
  sub_country: string | null;
  thumbnail_image: string;
  description: string | null;
  global_rank: number | null;
  avg_rating: number | null;
  review_count: number;
  week_label: string;
  why_ai: string | null;
}

export function useCourseOfTheWeek() {
  return useQuery({
    queryKey: ['course-of-the-week'],
    queryFn: async (): Promise<CourseOfTheWeek | null> => {
      const { data: courseRow, error: courseError } = await supabase.rpc('get_course_of_the_week' as any);
      if (courseError || !courseRow) {
        if (import.meta.env.DEV) console.error('[useCourseOfTheWeek] course error:', courseError);
        if (import.meta.env.DEV && courseError) throw courseError;
        return null;
      }

      const course = Array.isArray(courseRow) ? (courseRow as any[])[0] : (courseRow as any);
      if (!course) return null;

      // Fetch the hero_feature blurb for this course
      const { data: blurbRow, error: blurbError } = await supabase
        .from('course_mood_blurbs')
        .select('blurb')
        .eq('course_id', course.course_id)
        .eq('mood', 'hero_feature')
        .is('user_id', null)
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (blurbError && import.meta.env.DEV) {
        console.error('[useCourseOfTheWeek] blurb fetch error:', blurbError);
      }

      return {
        ...(course as CourseOfTheWeek),
        why_ai: blurbRow?.blurb ?? null,
      };
    },
    staleTime: 60 * 60 * 1000,
  });
}

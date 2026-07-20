/**
 * useCourseOfTheWeek — daily-rotating Top-100 pick surfaced on the overview.
 * Server-side RPC drives selection; client caches for an hour.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseOfTheWeek {
  course_id: string;
  course_name: string;
  country: string;
  region: string | null;
  thumbnail_image: string | null;
  list_label: string;
  list_rank: number;
  avg_rating: number;
  review_count: number;
  reviews_this_week: number;
  quote: string | null;
  reviewer_name: string | null;
}

export function useCourseOfTheWeek() {
  return useQuery<CourseOfTheWeek | null>({
    queryKey: ['course-of-the-week'],
    queryFn: async () => {
      // NOTE: rpc is called ON the client object — do not detach `.rpc`.
      const { data, error } = await supabase.rpc('get_course_of_the_week');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as CourseOfTheWeek | null) ?? null;
    },
    staleTime: 60 * 60 * 1000,
  });
}

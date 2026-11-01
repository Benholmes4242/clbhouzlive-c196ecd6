/**
 * MS3 §5 — the course a course_share message points at: name, region and the
 * existing thumbnail, plus its first active Top 100 placement (global first)
 * from the shared list-rank authority. A missing course renders the message
 * body as a plain bubble (MessageBubble owns that fallback).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCourseListRanks } from '@/lib/courses/listRank';

export interface CourseShareCard {
  id: string;
  name: string;
  region: string | null;
  thumbnail_image: string | null;
}

export function useCourseShareCard(courseId: string | null) {
  const courseQuery = useQuery({
    queryKey: ['course-share-card', courseId ?? ''],
    enabled: !!courseId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<CourseShareCard | null> => {
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, region, thumbnail_image')
        .eq('id', courseId as string)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as CourseShareCard) ?? null;
    },
  });

  const ranks = useCourseListRanks(courseId ? [courseId] : []);
  const rank = courseId ? (ranks.data?.get(courseId)?.[0]?.rank ?? null) : null;

  return {
    course: courseQuery.data ?? null,
    isLoading: courseQuery.isLoading,
    isError: courseQuery.isError,
    rank,
  };
}

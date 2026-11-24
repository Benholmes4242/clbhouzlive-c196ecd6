/**
 * THE ONE COURSE MEDIA COUNT (BRIEF_MEDIA_TAB_AND_THE_COUNT §1).
 *
 * Two surfaces used to answer "how much media is at this course" two ways: the
 * Media tab asked Postgres, and the Course tab's strip took the LENGTH of a
 * 30-row fetch that ran two un-deduplicated reads and ignored post status. On
 * Sundridge East that read 30 (19 post media + 13 review media, 11 of them the
 * same photographs) against the true 21.
 *
 * DEFINITION, single and server-side: every DISTINCT media item visible at this
 * course — media on PUBLISHED posts tagged to the course (or to a review of
 * it), plus review photographs not already published as a post, with blocked
 * authors excluded. That is `get_course_media_counts`, unchanged and deployed.
 *
 * The query key matches useCourseMedia's counts query exactly, so the tab and
 * the strip share ONE cache entry and one request.
 */
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface CourseMediaCounts {
  photos: number;
  videos: number;
  total: number;
}

export const courseMediaCountsKey = (courseId: string, userId: string | undefined) =>
  ['course-media-counts', courseId, userId] as const;

export async function fetchCourseMediaCounts(
  courseId: string,
  userId: string | undefined,
): Promise<CourseMediaCounts> {
  const { data, error } = await supabase.rpc('get_course_media_counts', {
    p_user_id: userId ?? null,
    p_course_id: courseId,
  } as { p_user_id: string | null; p_course_id: string });
  if (error) throw error;
  const row = (data?.[0] ?? { photos: 0, videos: 0 }) as { photos: number; videos: number };
  const photos = Number(row.photos) || 0;
  const videos = Number(row.videos) || 0;
  return { photos, videos, total: photos + videos };
}

export function useCourseMediaCounts(courseId: string | undefined) {
  const { user } = useSupabaseSession();
  return useQuery({
    queryKey: courseMediaCountsKey(courseId ?? '', user?.id),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000,
    queryFn: () => fetchCourseMediaCounts(courseId as string, user?.id),
  });
}

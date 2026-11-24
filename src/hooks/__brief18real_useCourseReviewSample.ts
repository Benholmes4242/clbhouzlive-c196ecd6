/** REVIEWS_SAMPLE_1: lightweight complete rating sample, independent of the
 * 100-row, sorted/blocked prose list. Existing review invalidations match its
 * course-reviews-full prefix. Stable id ordering and explicit pagination avoid
 * pretending a truncated browser read is a community sample. RLS still applies.
 * No RPC/schema changes; only existing non-mock course_ratings score columns. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ReviewSampleRow } from '@/lib/reviews/communitySample';

const PAGE_SIZE = 500;
export async function fetchCourseReviewSample(courseId: string): Promise<ReviewSampleRow[]> {
  const rows: ReviewSampleRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from('course_ratings')
      .select('id, user_id, rating, design_score, condition_score, clubhouse_score, facilities_score')
      .eq('course_id', courseId).eq('is_mock', false).not('rating', 'is', null)
      .order('id', { ascending: true }).range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as ReviewSampleRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export function useCourseReviewSample(courseId: string, viewerId: string | undefined) {
  return useQuery({
    queryKey: ['course-reviews-full', courseId, 'community-sample', viewerId],
    enabled: Boolean(courseId),
    queryFn: () => fetchCourseReviewSample(courseId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
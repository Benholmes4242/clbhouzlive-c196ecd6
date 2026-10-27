/**
 * CLAIM SHEET REBUILD §1 — UNANSWERED REVIEW COUNT.
 *
 * How many of a course's real (non-mock) written reviews still have no reply
 * from the club. Read ONLY while the claim sheet is open: it is a two-hop
 * browser read (review ids, then their responses) that no other surface
 * needs, so it is not part of any shared query. staleTime 5 min matches the
 * other claim-sheet figures. RLS still applies; no RPC/schema changes.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUnansweredReviewCount(courseId: string | undefined, open: boolean) {
  return useQuery({
    queryKey: ['unanswered-review-count', courseId],
    enabled: Boolean(open && courseId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data: reviews, error: rErr } = await supabase
        .from('course_ratings')
        .select('id')
        .eq('course_id', courseId as string)
        .eq('is_mock', false)
        .not('review', 'is', null)
        .neq('review', '');
      if (rErr) throw rErr;
      const ids = (reviews ?? []).map((r) => r.id as string);
      if (!ids.length) return 0;
      const { data: responses, error: sErr } = await supabase
        .from('review_responses')
        .select('review_id')
        .in('review_id', ids)
        .eq('is_deleted', false);
      if (sErr) throw sErr;
      const answered = new Set((responses ?? []).map((r) => r.review_id as string));
      return ids.filter((id) => !answered.has(id)).length;
    },
  });
}

/**
 * The review header's course facts (BRIEF_REVIEW_STEP_ONE §1): the community
 * average and count from course_rating_aggregates, and the first rank label
 * from active Top 100 memberships. Reads nothing about rounds or handicaps.
 * A failed read yields no facts, so the header omits them rather than guessing.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { firstRankLabel } from '@/features/composer-flow/reviewCourseSearchRules';

export interface ReviewHeaderFacts {
  avg: number | null;
  count: number;
  rank: string | null;
}

/** "{avg} from {n} members" applies only with at least one review and an average. */
export function headerScore(facts: ReviewHeaderFacts): { avg: string; count: number } | null {
  if (!facts.count || facts.avg == null || !Number.isFinite(facts.avg)) return null;
  return { avg: facts.avg.toFixed(1), count: facts.count };
}

export function useReviewHeaderFacts(courseId: string | undefined): ReviewHeaderFacts {
  const agg = useCourseRatingAggregates(courseId);
  const rankQ = useQuery({
    queryKey: ['rv2-header-rank', courseId],
    enabled: !!courseId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_top100_memberships')
        .select('rank, top100_lists!inner(slug, is_active)')
        .eq('course_id', courseId!);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<{ rank: number; top100_lists: { slug?: string; is_active?: boolean } | Array<{ slug?: string; is_active?: boolean }> | null }>;
      const memberships = rows.flatMap(r => {
        const list = Array.isArray(r.top100_lists) ? r.top100_lists[0] : r.top100_lists;
        return list?.slug ? [{ slug: list.slug, rank: Number(r.rank), active: list.is_active }] : [];
      });
      return firstRankLabel(memberships);
    },
  });
  const a = agg.isError ? null : agg.data;
  return {
    avg: a?.avg_overall_score != null ? Number(a.avg_overall_score) : null,
    count: Number(a?.review_count ?? 0),
    rank: rankQ.isError ? null : rankQ.data ?? null,
  };
}

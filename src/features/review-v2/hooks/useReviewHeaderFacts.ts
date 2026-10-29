/**
 * The review header's course facts (BRIEF_REVIEW_STEP_ONE §1): the community
 * average and count from course_rating_aggregates. Reads nothing about rounds
 * or handicaps. A failed read yields no facts, so the header omits them rather
 * than guessing.
 *
 * The rank no longer lives here: since BRIEF_REVIEW_STEP_ONE_COURSE_HERO it is
 * part of the masthead kicker, built by courseMastheadKicker from
 * useCourseTop100Standing — the same rule the course page uses.
 */
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';

export interface ReviewHeaderFacts {
  avg: number | null;
  count: number;
}

/** "{avg} from {n} members" applies only with at least one review and an average. */
export function headerScore(facts: ReviewHeaderFacts): { avg: string; count: number } | null {
  if (!facts.count || facts.avg == null || !Number.isFinite(facts.avg)) return null;
  return { avg: facts.avg.toFixed(1), count: facts.count };
}

export function useReviewHeaderFacts(courseId: string | undefined): ReviewHeaderFacts {
  const agg = useCourseRatingAggregates(courseId);
  const a = agg.isError ? null : agg.data;
  return {
    avg: a?.avg_overall_score != null ? Number(a.avg_overall_score) : null,
    count: Number(a?.review_count ?? 0),
  };
}

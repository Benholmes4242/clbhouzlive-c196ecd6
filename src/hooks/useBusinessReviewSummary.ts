/**
 * Insights section 7 "Reviews" (CB89).
 *
 * Reads `get_business_review_summary` (hand-applied INSIGHTS_REVIEWS_V1, not
 * yet in generated types). The server owns every count, average (already
 * rounded to one decimal), county rank and the unreplied figure; mock reviews
 * are excluded server-side. The client never re-counts or re-rounds. p_days
 * only moves new_count / new_avg. Previous-period data stays on screen while
 * a new period loads.
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ReviewScoreKey = 'design' | 'condition' | 'facilities' | 'clubhouse';
export interface ReviewSummaryCourse { course_id: string; name: string; reviews: number; avg: number; rank: number | null; rank_of: number | null; county: string | null }
export interface ReviewSummaryScore { key: ReviewScoreKey; avg: number | null; count: number }
export type BusinessReviewSummary =
  | { linked: false }
  | { linked: true; period_days: number; total: number; avg: number | null; new_count: number; new_avg: number | null; unreplied: number; courses: ReviewSummaryCourse[]; scores: ReviewSummaryScore[] };

const num = (v: unknown) => Number(v) || 0;
const numOrNull = (v: unknown) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

export function parseReviewSummary(raw: any, days: number): BusinessReviewSummary {
  const p = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {});
  if (p.linked !== true) return { linked: false };
  return {
    linked: true,
    period_days: num(p.period_days) || days,
    total: num(p.total),
    avg: numOrNull(p.avg),
    new_count: num(p.new_count),
    new_avg: numOrNull(p.new_avg),
    unreplied: num(p.unreplied),
    courses: (Array.isArray(p.courses) ? p.courses : []).map((c: any) => ({
      course_id: String(c.course_id), name: String(c.name ?? ''), reviews: num(c.reviews), avg: num(c.avg),
      rank: numOrNull(c.rank), rank_of: numOrNull(c.rank_of), county: c.county ?? null,
    })),
    scores: (Array.isArray(p.scores) ? p.scores : []).map((s: any) => ({ key: s.key, avg: numOrNull(s.avg), count: num(s.count) })),
  };
}

export function useBusinessReviewSummary(businessId: string | undefined, days: number) {
  return useQuery({
    queryKey: ['business-review-summary', businessId, days],
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<BusinessReviewSummary> => {
      const { data, error } = await (supabase.rpc as any)('get_business_review_summary', { p_business_id: businessId, p_days: days });
      if (error) throw error;
      return parseReviewSummary(data, days);
    },
  });
}

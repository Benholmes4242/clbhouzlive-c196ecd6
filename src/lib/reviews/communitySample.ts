/** REVIEWS_SAMPLE_1: one complete non-mock rating sample owns ALL Reviews
 * figures. Per-category counts include only finite values, not overall count.
 * Exclusion arithmetic stays in youDerivations; its legacy names accept any
 * mean/count pair without changing its signature or You-tab consumers.
 * Future ranges/splits must use communityRows, never the inclusive rows. */
import { fieldExcludingViewer } from '@/lib/courseYou/youDerivations';
import { getRatingTier } from '@/lib/ratingTier';
import type { RatingTierDistributionData } from '@/components/courses/review/RatingTierDistribution';

export interface ReviewSampleRow {
  id: string;
  user_id: string;
  rating: number | null;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
}
type ScoreKey = 'rating' | 'design_score' | 'condition_score' | 'clubhouse_score' | 'facilities_score';
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function reviewsCommunitySample(rows: readonly ReviewSampleRow[], viewerId: string | undefined) {
  const rated = rows.filter((row) => finite(row.rating));
  const viewer = viewerId ? rated.find((row) => row.user_id === viewerId) : undefined;
  const communityRows = viewer ? rated.filter((row) => row.id !== viewer.id) : rated;
  const excludingMean = (key: ScoreKey): number | null => {
    const values = rated.map((row) => row[key]).filter(finite);
    const viewerValue = viewer?.[key];
    return fieldExcludingViewer({
      fieldAvgOverPar: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
      fieldRounds: values.length,
      viewerAvgOverPar: finite(viewerValue) ? viewerValue : null,
      viewerRounds: finite(viewerValue) ? 1 : 0,
    });
  };
  const distribution: RatingTierDistributionData = { exceptional: 0, excellent: 0, good: 0, fair: 0, poor: 0 };
  for (const row of communityRows) {
    distribution[getRatingTier(row.rating).toLowerCase() as keyof RatingTierDistributionData] += 1;
  }
  const score = excludingMean('rating');
  const viewerScore = viewer?.rating ?? null;
  return {
    score, viewerScore,
    delta: score != null && viewerScore != null ? Math.round((viewerScore - score) * 10) / 10 : null,
    ratingCount: communityRows.length,
    totalRatingCount: rated.length,
    communityRows, distribution,
    categories: {
      design: excludingMean('design_score'),
      condition: excludingMean('condition_score'),
      clubhouse: excludingMean('clubhouse_score'),
      facilities: excludingMean('facilities_score'),
    },
  };
}
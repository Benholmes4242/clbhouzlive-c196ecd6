import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

import { RatingBar } from '@/components/ui/RatingBar';
import { RatingTierDistribution, RatingTierDistributionData } from './RatingTierDistribution';

interface CategoryAverage {
  design: number | null;
  condition: number | null;
  clubhouse: number | null;
  facilities: number | null;
}

interface CourseReviewsSummaryProps {
  averageRating: number;
  reviewCount: number;
  distribution: RatingTierDistributionData;
  categoryAverages: CategoryAverage;
  userScore?: number | null;
  userHasRating: boolean;
  onRateCourse: () => void;
}

const formatScore = (value: number | null | undefined) =>
  value == null ? '—' : value.toFixed(1);

// Get tier label from score
const getTierLabel = (score: number): string => {
  if (score >= 9) return 'Outstanding';
  if (score >= 8) return 'Excellent';
  if (score >= 7) return 'Very Good';
  if (score >= 6) return 'Good';
  return 'Fair';
};

/**
 * Compute community highlights from category averages.
 * Returns top 2-3 categories with sufficient scores.
 */
const computeHighlights = (categoryAverages: CategoryAverage): string[] => {
  const categories = [
    { name: 'Design', value: categoryAverages.design },
    { name: 'Condition', value: categoryAverages.condition },
    { name: 'Clubhouse', value: categoryAverages.clubhouse },
    { name: 'Facilities', value: categoryAverages.facilities },
  ].filter((c) => c.value !== null && c.value >= 6.0) as { name: string; value: number }[];

  // Sort by value descending and take top 2-3
  categories.sort((a, b) => b.value - a.value);
  
  // Take top 2, or 3 if there's a clear gap
  const top = categories.slice(0, 2);
  if (categories.length >= 3 && categories[2].value >= 8.0) {
    top.push(categories[2]);
  }
  
  return top.map((c) => c.name);
};

export const CourseReviewsSummary: React.FC<CourseReviewsSummaryProps> = ({
  averageRating,
  reviewCount,
  distribution,
  categoryAverages,
  userScore,
  userHasRating,
  onRateCourse,
}) => {
  
  const onlyUserHasRated = reviewCount === 1 && userHasRating;

  // Community highlights - only show when ≥3 reviews
  const highlights = reviewCount >= 3 ? computeHighlights(categoryAverages) : [];

  // Calculate comparison message
  let comparisonMessage: React.ReactNode = null;
  if (!onlyUserHasRated && userHasRating && userScore && averageRating) {
    const diffRaw = userScore - averageRating;
    const diff = Number(diffRaw.toFixed(1));
    const absDiff = Math.abs(diff);

    if (absDiff < 0.2) {
      // On par
      comparisonMessage = (
        <div className="flex items-start gap-2">
          <span 
            className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          </span>
          <p className="text-sm text-emerald-600">
            Your score matches the community consensus.
          </p>
        </div>
      );
    } else if (diff > 0) {
      // Higher
      comparisonMessage = (
        <div className="flex items-start gap-2">
          <span 
            className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50"
          >
            <ArrowUpIcon className="h-3.5 w-3.5 text-emerald-600" />
          </span>
          <p className="text-sm text-emerald-600">
            You rated this course {absDiff.toFixed(1)} point{absDiff === 1.0 ? '' : 's'} higher than
            the community.
          </p>
        </div>
      );
    } else {
      // Lower
      comparisonMessage = (
        <div className="flex items-start gap-2">
          <span 
            className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-50"
          >
            <ArrowDownIcon className="h-3.5 w-3.5 text-rose-600" />
          </span>
          <p className="text-sm text-rose-600">
            You rated this course {absDiff.toFixed(1)} point{absDiff === 1.0 ? '' : 's'} lower than
            the community.
          </p>
        </div>
      );
    }
  }

  return (
    <div>
      {/* Top row: Rating + Distribution */}
      <div className="mb-4">
        <div className="flex w-full items-start gap-1.5">
          {/* LEFT: score + tier label */}
          <div className="flex min-w-[140px] max-w-[40%] flex-col items-center">
            {/* Number and tier label group - centered together */}
            <div className="flex flex-col items-center mb-2">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-semibold tracking-tight text-foreground">
                  {averageRating.toFixed(1)}
                </span>
              </div>
             {/* Tier label - solid color matching unified system */}
              <span 
                className={cn(
                  "text-base font-semibold uppercase tracking-wide",
                  averageRating >= 9 
                   ? "text-[#d97706]" 
                   : "text-[#6b7280]"
                )}
              >
                {getTierLabel(averageRating)}
              </span>
            </div>

            {/* Rating count - centered */}
            <p className="text-xs text-slate-500 text-center">
              {reviewCount} {reviewCount === 1 ? 'rating' : 'ratings'}
            </p>
          </div>

          {/* RIGHT: distribution bars */}
          <div className="flex-1 ml-4">
            <RatingTierDistribution distribution={distribution} />
          </div>
        </div>
      </div>

      {/* Community Highlights (Upgrade A) - only show when ≥3 reviews */}
      {highlights.length > 0 && (
        <div className="mb-4 pb-4 border-b border-slate-200/60">
          <p className="text-[11px] font-medium tracking-wide text-slate-500 mb-1.5">
            Highlights
          </p>
          <p className="text-sm text-slate-700">
            {highlights.join(' • ')}
          </p>
        </div>
      )}

      {/* Category averages - 2x2 grid with labels above bars */}
      {(categoryAverages.design || categoryAverages.condition || categoryAverages.clubhouse || categoryAverages.facilities) && (
        <div className="border-t border-slate-200/60 pt-4 mt-4 mb-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {/* Design - UNIFIED: RatingBar uses its own value >= 9 threshold */}
            {categoryAverages.design !== null && (
              <div className="flex flex-col">
                <span className="text-[11px] font-medium tracking-wide text-slate-600 mb-1">
                  Design
                </span>
                <div className="flex items-center gap-2">
                  <RatingBar value={categoryAverages.design} />
                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap tabular-nums">
                    {formatScore(categoryAverages.design)}
                  </span>
                </div>
              </div>
            )}

            {/* Condition - UNIFIED: RatingBar uses its own value >= 9 threshold */}
            {categoryAverages.condition !== null && (
              <div className="flex flex-col">
                <span className="text-[11px] font-medium tracking-wide text-slate-600 mb-1">
                  Condition
                </span>
                <div className="flex items-center gap-2">
                  <RatingBar value={categoryAverages.condition} />
                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap tabular-nums">
                    {formatScore(categoryAverages.condition)}
                  </span>
                </div>
              </div>
            )}

            {/* Clubhouse - UNIFIED: RatingBar uses its own value >= 9 threshold */}
            {categoryAverages.clubhouse !== null && (
              <div className="flex flex-col">
                <span className="text-[11px] font-medium tracking-wide text-slate-600 mb-1">
                  Clubhouse
                </span>
                <div className="flex items-center gap-2">
                  <RatingBar value={categoryAverages.clubhouse} />
                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap tabular-nums">
                    {formatScore(categoryAverages.clubhouse)}
                  </span>
                </div>
              </div>
            )}

            {/* Facilities - UNIFIED: RatingBar uses its own value >= 9 threshold */}
            {categoryAverages.facilities !== null && (
              <div className="flex flex-col">
                <span className="text-[11px] font-medium tracking-wide text-slate-600 mb-1">
                  Facilities
                </span>
                <div className="flex items-center gap-2">
                  <RatingBar value={categoryAverages.facilities} />
                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap tabular-nums">
                    {formatScore(categoryAverages.facilities)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit your rating CTA - centered below category breakdowns */}
      {userHasRating && (
        <div className="flex justify-center mt-4 mb-3">
          <button
            type="button"
            onClick={onRateCourse}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.97] transition-all min-h-[40px]"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit your rating</span>
          </button>
        </div>
      )}

      {/* Rate this course CTA for non-reviewers */}
      {!userHasRating && (
        <div className="flex justify-center mt-4 mb-3">
          <button
            type="button"
            onClick={onRateCourse}
            className="inline-flex items-center px-5 py-2 rounded-full text-[13px] font-bold text-white active:scale-[0.97] transition-all"
            style={{
              background: '#F7931E',
              boxShadow: '0 4px 14px rgba(247,147,30,0.3)',
            }}
          >
            Rate this course
          </button>
        </div>
      )}

      {/* Comparison message */}
      {comparisonMessage && (
        <div className="mt-3 mb-3 pb-[2px] flex items-center justify-center">
          {comparisonMessage}
        </div>
      )}
    </div>
  );
};

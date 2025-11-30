import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon } from 'lucide-react';
import { getScoreTier } from '@/utils/getScoreTier';
import { RatingBar } from '@/components/ui/RatingBar';
import { RatingBadge } from '@/components/ui/RatingBadge';

interface DistributionData {
  outstanding: number;
  excellent: number;
  veryGood: number;
  good: number;
  fair: number;
}

interface CategoryAverage {
  design: number | null;
  condition: number | null;
  clubhouse: number | null;
  facilities: number | null;
}

interface CourseReviewsSummaryProps {
  averageRating: number;
  reviewCount: number;
  distribution: DistributionData;
  categoryAverages: CategoryAverage;
  userScore?: number | null;
  userHasRating: boolean;
  onRateCourse: () => void;
}

const formatScore = (value: number | null | undefined) =>
  value == null ? '—' : value.toFixed(1);

export const CourseReviewsSummary: React.FC<CourseReviewsSummaryProps> = ({
  averageRating,
  reviewCount,
  distribution,
  categoryAverages,
  userScore,
  userHasRating,
  onRateCourse,
}) => {
  const tierData = getScoreTier(averageRating);
  const onlyUserHasRated = reviewCount === 1 && userHasRating;

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
          <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50">
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
          <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50">
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
          <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-50">
            <ArrowDownIcon className="h-3.5 w-3.5 text-rose-500" />
          </span>
          <p className="text-sm text-rose-600">
            You rated this course {absDiff.toFixed(1)} point{absDiff === 1.0 ? '' : 's'} lower than
            the community.
          </p>
        </div>
      );
    }
  }

  // Map distribution directly from System-2 tier buckets
  const distributionItems = [
    { count: distribution.outstanding, tier: getScoreTier(9.5) },
    { count: distribution.excellent, tier: getScoreTier(8.5) },
    { count: distribution.veryGood, tier: getScoreTier(7.5) },
    { count: distribution.good, tier: getScoreTier(6.5) },
    { count: distribution.fair, tier: getScoreTier(5) },
  ];

  const maxCount = Math.max(...distributionItems.map(d => d.count), 1);

  return (
    <div>
      {/* Top row: Rating + Distribution */}
      <div className="mb-5">
        <div className="mt-3 flex w-full items-start gap-1.5">
          {/* LEFT: score + badge */}
          <div className="flex min-w-[140px] max-w-[40%] flex-col items-start">
            {/* Number and badge group - centered together */}
            <div className="flex flex-col items-center self-start mb-2">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-semibold tracking-tight text-slate-900">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <RatingBadge tierData={tierData} />
            </div>

            {/* Based on X reviews */}
            <p className="text-xs text-slate-500">
              Based on {reviewCount} review{reviewCount === 1 ? '' : 's'}
            </p>
          </div>

          {/* RIGHT: distribution bars */}
          <div className="flex-1">
            {distributionItems.map((item) => {
              let percentage = (item.count / maxCount) * 100;
              // Reduce outstanding bar by 10%
              if (item.tier.tier === 'outstanding') {
                percentage *= 0.9;
              }
              return (
                <div key={item.tier.tier} className="mb-1.5 flex items-center gap-0">
                  {/* Label */}
                  <span className="w-24 text-sm text-slate-700">
                    {item.tier.label}
                  </span>

                  {/* Bar – takes remaining width */}
                  <div className="flex-1">
                    <RatingBar 
                      value={percentage}
                      max={100}
                      mode="banded"
                      band={item.tier.tier}
                    />
                  </div>

                  {/* Count */}
                  <span className="w-6 text-right text-xs text-slate-500">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category averages - 2x2 grid with labels above bars */}
      {(categoryAverages.design || categoryAverages.condition || categoryAverages.clubhouse || categoryAverages.facilities) && (
        <div className="border-t border-slate-200/60 pt-3 mt-3 mb-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Design */}
            {categoryAverages.design !== null && (
              <div className="flex flex-col">
                <span className="text-[11px] font-medium tracking-wide text-slate-600 mb-1">
                  Design
                </span>
                <div className="flex items-center gap-2">
                  <RatingBar value={categoryAverages.design} mode="neutral" />
                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                    {formatScore(categoryAverages.design)}
                  </span>
                </div>
              </div>
            )}

            {/* Condition */}
            {categoryAverages.condition !== null && (
              <div className="flex flex-col">
                <span className="text-[11px] font-medium tracking-wide text-slate-600 mb-1">
                  Condition
                </span>
                <div className="flex items-center gap-2">
                  <RatingBar value={categoryAverages.condition} mode="neutral" />
                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                    {formatScore(categoryAverages.condition)}
                  </span>
                </div>
              </div>
            )}

            {/* Clubhouse */}
            {categoryAverages.clubhouse !== null && (
              <div className="flex flex-col">
                <span className="text-[11px] font-medium tracking-wide text-slate-600 mb-1">
                  Clubhouse
                </span>
                <div className="flex items-center gap-2">
                  <RatingBar value={categoryAverages.clubhouse} mode="neutral" />
                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                    {formatScore(categoryAverages.clubhouse)}
                  </span>
                </div>
              </div>
            )}

            {/* Facilities */}
            {categoryAverages.facilities !== null && (
              <div className="flex flex-col">
                <span className="text-[11px] font-medium tracking-wide text-slate-600 mb-1">
                  Facilities
                </span>
                <div className="flex items-center gap-2">
                  <RatingBar value={categoryAverages.facilities} mode="neutral" />
                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                    {formatScore(categoryAverages.facilities)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison message */}
      {comparisonMessage && (
        <div className="mt-3 mb-3 pb-[2px] flex items-center justify-center">
          {comparisonMessage}
        </div>
      )}

      {/* CTA button */}
      {!userHasRating && (
        <Button
          type="button"
          className="w-full h-11 rounded-lg"
          variant="outline"
          onClick={onRateCourse}
        >
          Rate this course
        </Button>
      )}
    </div>
  );
};

import React from 'react';
import { Button } from '@/components/ui/button';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { CheckCircle2, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon } from 'lucide-react';
import { getScoreTier } from '@/utils/getScoreTier';

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
          <p className="text-xs text-emerald-600">
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
          <p className="text-xs text-emerald-600">
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
          <p className="text-xs text-rose-600">
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
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)] gap-x-6 gap-y-2 items-start">
          {/* LEFT: score hero */}
          <div>
            <div className="mt-0.5 flex items-center gap-2">
              <ClubhouseLogo size="md" />
              <span className="text-[28px] font-semibold text-slate-900 leading-none">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 ml-1">/10</span>
            </div>

            <div className="mt-2 mb-1 inline-flex items-center">
              <span 
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${tierData.bg} ${tierData.text}`}
              >
                {tierData.label}
              </span>
            </div>

            <p className="mt-2 text-[12px] text-slate-600">
              Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* RIGHT: rating distribution */}
          <div className="space-y-1.5">
            {distributionItems.map((item) => {
              const percentage = (item.count / maxCount) * 100;
              return (
                <div key={item.tier.tier} className="flex items-center gap-3">
                  <span className="w-20 text-[11px] text-slate-500">
                    {item.tier.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.tier.barFill} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-4 text-right text-[11px] text-slate-500">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category averages - 2x2 grid */}
      {(categoryAverages.design || categoryAverages.condition || categoryAverages.clubhouse || categoryAverages.facilities) && (
        <div className="border-t border-slate-200/60 pt-3 mb-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {/* Design */}
            {categoryAverages.design !== null && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                  Design
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 transition-all"
                      style={{ width: `${(categoryAverages.design / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-900 w-6 text-right">
                    {formatScore(categoryAverages.design)}
                  </span>
                </div>
              </div>
            )}

            {/* Condition */}
            {categoryAverages.condition !== null && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                  Condition
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 transition-all"
                      style={{ width: `${(categoryAverages.condition / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-900 w-6 text-right">
                    {formatScore(categoryAverages.condition)}
                  </span>
                </div>
              </div>
            )}

            {/* Clubhouse */}
            {categoryAverages.clubhouse !== null && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                  Clubhouse
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 transition-all"
                      style={{ width: `${(categoryAverages.clubhouse / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-900 w-6 text-right">
                    {formatScore(categoryAverages.clubhouse)}
                  </span>
                </div>
              </div>
            )}

            {/* Facilities */}
            {categoryAverages.facilities !== null && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                  Facilities
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-600 transition-all"
                      style={{ width: `${(categoryAverages.facilities / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-900 w-6 text-right">
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

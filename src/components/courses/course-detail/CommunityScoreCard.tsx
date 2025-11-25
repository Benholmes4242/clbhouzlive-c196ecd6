import React from 'react';
import { CheckCircle2, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseRatingAggregate } from '@/hooks/useCourseRatingAggregates';
import { UserCourseRating } from '@/hooks/useUserCourseRating';

interface CommunityScoreCardProps {
  courseId: string;
  ratingAggregates: CourseRatingAggregate | null | undefined;
  userRating: UserCourseRating | null | undefined;
  onRateClick: () => void;
  onSeeAllReviews?: () => void;
}

const formatScore = (score: number) => {
  return score % 1 === 0 ? score.toString() : score.toFixed(1);
};

// Get quality label from score
const getRatingLabel = (score: number | null | undefined): string | null => {
  if (score == null) return null;
  if (score >= 9) return 'Outstanding';
  if (score >= 8) return 'Excellent';
  if (score >= 7) return 'Very good';
  if (score >= 6) return 'Good';
  if (score >= 5) return 'Mixed';
  return 'Needs improvement';
};

const CommunityScoreCard: React.FC<CommunityScoreCardProps> = ({
  courseId,
  ratingAggregates,
  userRating,
  onRateClick,
  onSeeAllReviews,
}) => {
  const totalRatings = ratingAggregates?.review_count || 0;
  const communityAverage = ratingAggregates?.avg_overall_score || 0;

  // Empty state - no ratings yet
  if (totalRatings === 0) {
    return (
      <div className="mt-6 rounded-3xl bg-white shadow-sm px-4 py-5 sm:px-5 sm:py-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Community Score
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          No ratings yet – be the first to rate this course!
        </p>

        <Button
          onClick={onRateClick}
          className="mt-4 w-full"
          variant="outline"
        >
          Rate this course
        </Button>
      </div>
    );
  }

  // Check if only the user has rated
  const onlyUserHasRated = totalRatings === 1 && userRating;

  // Calculate comparison message
  let comparisonMessage: React.ReactNode = null;
  if (!onlyUserHasRated && userRating && communityAverage) {
    const diffRaw = userRating.rating - communityAverage;
    const diff = Number(diffRaw.toFixed(1));
    const absDiff = Math.abs(diff);

    if (absDiff < 0.2) {
      // On par (within 0.2 points)
      comparisonMessage = (
        <div className="mt-3 flex items-start gap-2">
          <span className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          </span>
          <p className="text-xs text-emerald-600">
            Your score matches the community consensus.
          </p>
        </div>
      );
    } else if (diff > 0) {
      // Higher
      comparisonMessage = (
        <div className="mt-3 flex items-start gap-2">
          <span className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50">
            <ArrowUpIcon className="h-3 w-3 text-emerald-600" />
          </span>
          <p className="text-xs text-emerald-600">
            You rated this course {absDiff.toFixed(1)} points higher than the community.
          </p>
        </div>
      );
    } else {
      // Lower
      comparisonMessage = (
        <div className="mt-3 flex items-start gap-2">
          <span className="mt-[2px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-50">
            <ArrowDownIcon className="h-3 w-3 text-rose-500" />
          </span>
          <p className="text-xs text-rose-600">
            You rated this course {absDiff.toFixed(1)} points lower than the community.
          </p>
        </div>
      );
    }
  }

  // Build category data
  const categories = [
    {
      id: 'design',
      label: 'Course Design',
      score: ratingAggregates?.avg_design_score,
    },
    {
      id: 'condition',
      label: 'Course Condition',
      score: ratingAggregates?.avg_condition_score,
    },
    {
      id: 'clubhouse',
      label: 'Clubhouse',
      score: ratingAggregates?.avg_clubhouse_score,
    },
    {
      id: 'facilities',
      label: 'Facilities',
      score: ratingAggregates?.avg_facilities_score,
    },
  ].filter((cat) => cat.score !== null && cat.score !== undefined);

  const qualityLabel = getRatingLabel(communityAverage);

  return (
    <div className="mt-6 rounded-3xl bg-white shadow-sm px-4 py-5 sm:px-5 sm:py-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left - credibility + title + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mb-1">
            Rated by the clbhouz community
          </p>

          <h3 className="text-lg font-semibold text-slate-900">
            Community Score
          </h3>
          
          <p className="mt-0.5 text-xs text-slate-500">
            Based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
          </p>

          {onlyUserHasRated && (
            <p className="mt-2 text-xs text-slate-500">
              Only you have rated this course so far.
            </p>
          )}
        </div>

        {/* Right - score + quality chip + ring icon */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {/* Score */}
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold tracking-tight text-slate-900">
              {formatScore(communityAverage)}
            </span>
            <span className="text-sm text-slate-500">/10</span>
          </div>

          {/* Quality chip */}
          {qualityLabel && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              {qualityLabel}
            </span>
          )}

          {/* Ring icon */}
          <div className="mt-1 flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 p-[2px]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* User vs community comparison */}
      {comparisonMessage}

      {/* Category rows */}
      {categories.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {categories.map((cat) => {
            const score = cat.score || 0;
            const labelText = getRatingLabel(score);

            return (
              <div key={cat.id} className="flex items-center gap-3">
                {/* Left label */}
                <div className="w-32 text-sm text-slate-700">
                  {cat.label}
                </div>

                {/* Bar */}
                <div className="flex-1">
                  <div className="h-3 w-full rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-slate-900 to-slate-700 transition-[width] duration-300 ease-out"
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Right numeric + descriptor */}
                <div className="ml-2 w-[100px] text-right text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {formatScore(score)}
                  </span>
                  {labelText && (
                    <span className="text-[11px] text-slate-500">
                      {' · '}{labelText}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* See all reviews link */}
      {onSeeAllReviews && (
        <div className="mt-4 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onSeeAllReviews}
            className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline transition-colors"
          >
            See all reviews
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityScoreCard;

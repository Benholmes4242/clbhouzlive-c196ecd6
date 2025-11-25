import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseRatingAggregate } from '@/hooks/useCourseRatingAggregates';
import { UserCourseRating } from '@/hooks/useUserCourseRating';

const ArrowUp = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M10 3L4 9H8V17H12V9H16L10 3Z"
      fill="#3CC76A"
    />
  </svg>
);

const ArrowDown = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M10 17L16 11H12V3H8V11H4L10 17Z"
      fill="#E85151"
    />
  </svg>
);

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
      <div className="mt-4 rounded-3xl bg-slate-50 border border-slate-100 px-4 py-4 sm:px-5 sm:py-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <h3 className="text-base font-semibold text-slate-900">
          Community Score
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          No ratings yet – be the first to rate this course!
        </p>

        <Button
          onClick={onRateClick}
          className="mt-3 w-full rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-900 py-2.5"
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
    const pointsLabel = absDiff === 1 ? "point" : "points";

    if (absDiff === 0) {
      // On par
      comparisonMessage = (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>You rate this course on par with the community.</span>
        </p>
      );
    } else if (diff > 0) {
      // Higher
      comparisonMessage = (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-600">
          <ArrowUp />
          <span>You rate this course {absDiff.toFixed(1)} {pointsLabel} higher than the community.</span>
        </p>
      );
    } else {
      // Lower
      comparisonMessage = (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-600">
          <ArrowDown />
          <span>You rate this course {absDiff.toFixed(1)} {pointsLabel} lower than the community.</span>
        </p>
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

  return (
    <div className="mt-4 rounded-3xl bg-slate-50 border border-slate-100 px-4 py-4 sm:px-5 sm:py-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left - title, meta, comparison */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900">
            Community Score
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
          </p>

          {comparisonMessage}

          {onlyUserHasRated && (
            <p className="mt-1 text-xs text-slate-500">
              Only you have rated this course so far.
            </p>
          )}
        </div>

        {/* Right - circular score badge */}
        <div className="flex items-center justify-end shrink-0">
          <div className="relative h-12 w-12">
            {/* Background circle */}
            <div className="absolute inset-0 rounded-full bg-slate-100" />
            {/* Conic gradient progress */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#f59e0b 0deg ${communityAverage * 36}deg, #e5e7eb ${communityAverage * 36}deg 360deg)`,
              }}
            />
            {/* Inner circle with score */}
            <div className="absolute inset-[3px] rounded-full bg-slate-50 flex items-center justify-center">
              <span className="text-xs font-semibold text-slate-900">
                {formatScore(communityAverage)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category rows */}
      {categories.length > 0 && (
        <div className="mt-4 space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3">
              <div className="w-32 shrink-0">
                <p className="text-xs font-medium text-slate-700">
                  {cat.label}
                </p>
              </div>

              <div className="flex-1">
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-[width] duration-300 ease-out"
                    style={{ width: `${((cat.score || 0) / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div className="w-10 text-right">
                <span className="text-xs font-semibold text-slate-800">
                  {formatScore(cat.score || 0)}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* See all reviews link */}
      {onSeeAllReviews && (
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={onSeeAllReviews}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 underline underline-offset-4 transition-colors"
          >
            See all reviews
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityScoreCard;

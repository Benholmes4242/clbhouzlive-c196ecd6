import React from 'react';
import { CheckCircle2, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseRatingAggregate } from '@/hooks/useCourseRatingAggregates';
import { UserCourseRating } from '@/hooks/useUserCourseRating';

import { RatingBar } from '@/components/ui/RatingBar';
import { RatingPill } from '@/components/ui/RatingPill';
import { RatingTierDistribution, RatingTierDistributionData } from '@/components/courses/review/RatingTierDistribution';

interface CommunityScoreCardProps {
  courseId: string;
  ratingAggregates: CourseRatingAggregate | null | undefined;
  userRating: UserCourseRating | null | undefined;
  distribution?: RatingTierDistributionData | null;
  onRateClick: () => void;
  onSeeAllReviews?: () => void;
}

// A3: Always show 1 decimal for consistency + tabular numerals
const formatScore = (score: number) => score.toFixed(1);

const CommunityScoreCard: React.FC<CommunityScoreCardProps> = ({
  courseId,
  ratingAggregates,
  userRating,
  distribution,
  onRateClick,
  onSeeAllReviews,
}) => {
  const totalRatings = ratingAggregates?.review_count || 0;
  const communityAverage = ratingAggregates?.avg_overall_score || 0;

  // Empty state - no ratings yet
  if (totalRatings === 0) {
    return (
      <div className="rounded-3xl bg-white shadow-sm px-4 py-6 sm:px-5 sm:py-7">
        <h3 className="text-xl font-semibold text-slate-900">
          Community Score
        </h3>
        <p className="mt-1 text-base text-slate-500">
          No ratings yet
        </p>

        <Button
          onClick={onRateClick}
          className="mt-4 w-full"
          variant="default"
        >
          Be the first to rate this course
        </Button>
        <p className="mt-2 text-xs text-slate-400 text-center">
          Your rating helps other golfers discover great courses.
        </p>
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
        <div className="mt-4 flex items-start gap-2">
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
        <div className="mt-4 flex items-start gap-2">
          <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50">
            <ArrowUpIcon className="h-3.5 w-3.5 text-emerald-600" />
          </span>
          <p className="text-sm text-emerald-600">
            You rated this course {absDiff.toFixed(1)} points higher than the community.
          </p>
        </div>
      );
    } else {
      // Lower
      comparisonMessage = (
        <div className="mt-4 flex items-start gap-2">
          <span className="mt-[2px] inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-50">
            <ArrowDownIcon className="h-3.5 w-3.5 text-rose-500" />
          </span>
          <p className="text-sm text-rose-600">
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

  

  // Check if we have distribution data
  const hasDistribution = distribution && (
    distribution.outstanding > 0 ||
    distribution.excellent > 0 ||
    distribution.veryGood > 0 ||
    distribution.good > 0 ||
    distribution.fair > 0
  );

  // Community Highlights v1 - derive from highest scoring categories
  const getCommunityHighlights = () => {
    if (categories.length === 0) return null;
    
    // Sort categories by score descending, take top 2-3
    const sorted = [...categories]
      .filter(c => c.score && c.score >= 8.0) // Only include high scores
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 3);
    
    if (sorted.length === 0) return null;
    
    return sorted.map(c => c.label.replace('Course ', ''));
  };

  const highlights = getCommunityHighlights();

  return (
    <div className="rounded-3xl bg-white shadow-sm px-5 py-6">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        {/* Left - title + meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-slate-900">
            Community Rating
          </h3>
          
          <p className="mt-1 text-sm text-slate-500">
            Based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
          </p>

          {onlyUserHasRated && (
            <p className="mt-2 text-sm text-slate-500">
              Only you have rated this course so far.
            </p>
          )}
        </div>

        {/* Right - score + badge stack (centered) */}
        <div className="inline-flex flex-col items-center gap-2">
          {/* Score centered above badge */}
          <span className="text-[34px] font-semibold text-slate-900 leading-none tabular-nums">
            {formatScore(communityAverage)}
          </span>

          {/* Quality chip centered under score */}
          <RatingPill score={communityAverage} />
        </div>
      </div>

      {/* Community Highlights v1 - under score, above distribution */}
      {highlights && highlights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Highlights
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight) => (
              <span
                key={highlight}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-full"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* User vs community comparison */}
      {comparisonMessage}

      {/* Rating tier distribution - mirrors Reviews tab */}
      {hasDistribution && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <RatingTierDistribution distribution={distribution} />
        </div>
      )}

      {/* Category grid - 2x2 layout matching Reviews tab */}
      {categories.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {categories.map((cat) => {
              const score = cat.score || 0;

              return (
                <div key={cat.id} className="flex flex-col">
                  <span className="text-[11px] font-medium tracking-wide text-slate-600 mb-1">
                    {cat.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <RatingBar value={score} />
                    <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap tabular-nums">
                      {formatScore(score)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* A1: See all reviews CTA - proper button styling with chevron */}
      {onSeeAllReviews && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onSeeAllReviews}
            className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-700 hover:text-slate-900 active:opacity-70 transition-colors min-h-[44px]"
          >
            <span>See all reviews</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityScoreCard;

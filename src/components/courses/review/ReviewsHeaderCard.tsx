import React from 'react';
import { CheckCircle2, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { getRatingBadgeKey, getRatingBadgeLabel, RATING_BADGE_COLORS } from '@/utils/ratingBadge';

// Re-export for backwards compatibility within this component
const BADGE_COLORS = RATING_BADGE_COLORS;

const getCommunityRatingLabel = (
  score: number | null | undefined
): { label: string; variant: 'fair' | 'good' | 'veryGood' | 'excellent' | 'outstanding' } | null => {
  const badgeKey = getRatingBadgeKey(score);
  if (!badgeKey) return null;
  const label = getRatingBadgeLabel(badgeKey);
  return { label, variant: badgeKey };
};

const CommunityRatingBadge: React.FC<{
  label: string;
  variant: 'fair' | 'good' | 'veryGood' | 'excellent' | 'outstanding';
}> = ({ label, variant }) => {
  const color = BADGE_COLORS[variant];

  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-3 py-1 border text-xs font-semibold uppercase"
      style={{
        backgroundColor: `${color}15`, // 15% opacity for background
        borderColor: `${color}40`, // 40% opacity for border
        color: color,
      }}
    >
      {label}
    </span>
  );
};

interface ReviewsHeaderCardProps {
  communityScore: number;
  reviewCount: number;
  userScore?: number | null;
  userHasRating: boolean;
  onRateCourse: () => void;
}

export const ReviewsHeaderCard: React.FC<ReviewsHeaderCardProps> = ({
  communityScore,
  reviewCount,
  userScore,
  userHasRating,
  onRateCourse,
}) => {
  const qualityData = getCommunityRatingLabel(communityScore);
  const onlyUserHasRated = reviewCount === 1 && userHasRating;

  // Calculate comparison message
  let comparisonMessage: React.ReactNode = null;
  if (!onlyUserHasRated && userHasRating && userScore && communityScore) {
    const diffRaw = userScore - communityScore;
    const diff = Number(diffRaw.toFixed(1));
    const absDiff = Math.abs(diff);

    if (absDiff < 0.2) {
      // On par (within 0.2 points)
      comparisonMessage = (
        <div className="mt-3 flex items-start gap-2">
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
        <div className="mt-3 flex items-start gap-2">
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
        <div className="mt-3 flex items-start gap-2">
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

  return (
    <div className="rounded-2xl bg-white shadow-sm px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Community score
          </p>
          <div className="mt-1 flex items-center gap-1">
            <ClubhouseLogo size="md" />
            <span className="text-2xl font-semibold text-slate-900">
              {communityScore.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-slate-500">/10</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* Badge */}
        {qualityData && <CommunityRatingBadge label={qualityData.label} variant={qualityData.variant} />}
      </div>

      {/* Comparison message */}
      {comparisonMessage}

      {/* CTA button if user hasn't rated */}
      {!userHasRating && (
        <div className="mt-4">
          <Button
            type="button"
            className="w-full h-11 rounded-lg"
            variant="outline"
            onClick={onRateCourse}
          >
            Rate this course
          </Button>
        </div>
      )}
    </div>
  );
};

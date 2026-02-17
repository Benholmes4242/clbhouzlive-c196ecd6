import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, ChevronRight, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseRatingAggregate } from '@/hooks/useCourseRatingAggregates';
import { UserCourseRating } from '@/hooks/useUserCourseRating';
import { cn } from '@/lib/utils';

import { RatingTierDistribution, RatingTierDistributionData } from '@/components/courses/review/RatingTierDistribution';

interface CommunityScoreCardProps {
  courseId: string;
  courseName?: string;
  ratingAggregates: CourseRatingAggregate | null | undefined;
  userRating: UserCourseRating | null | undefined;
  distribution?: RatingTierDistributionData | null;
  onRateClick: () => void;
  onSeeAllReviews?: () => void;
}

const formatScore = (score: number) => score.toFixed(1);

const getTierLabel = (score: number): string => {
  if (score >= 9) return 'Outstanding';
  if (score >= 8) return 'Excellent';
  if (score >= 7) return 'Very Good';
  if (score >= 6) return 'Good';
  return 'Fair';
};

const CommunityScoreCard: React.FC<CommunityScoreCardProps> = ({
  courseName,
  ratingAggregates,
  userRating,
  distribution,
  onRateClick,
  onSeeAllReviews,
}) => {
  const totalRatings = ratingAggregates?.review_count || 0;
  const communityAverage = ratingAggregates?.avg_overall_score || 0;
  const tierLabel = getTierLabel(communityAverage);
  
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Empty state
  if (totalRatings === 0) {
    return (
      <div className="bg-gradient-to-br from-muted to-card rounded-2xl border border-border p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Star className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No ratings yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Be the first to share your experience{courseName ? ` at ${courseName}` : ''}.
        </p>
        <Button
          onClick={onRateClick}
          className="px-5 py-2.5 bg-secondary text-foreground text-sm font-medium rounded-full hover:bg-secondary/80 transition-colors shadow-sm active:scale-[0.98]"
        >
          Rate this course
        </Button>
      </div>
    );
  }

  const onlyUserHasRated = totalRatings === 1 && userRating;

  // Comparison message
  let comparisonMessage: React.ReactNode = null;
  if (!onlyUserHasRated && userRating && communityAverage) {
    const diffRaw = userRating.rating - communityAverage;
    const diff = Number(diffRaw.toFixed(1));
    const absDiff = Math.abs(diff);

    if (absDiff < 0.2) {
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

  const categories = [
    { id: 'design', label: 'Design', score: ratingAggregates?.avg_design_score },
    { id: 'condition', label: 'Condition', score: ratingAggregates?.avg_condition_score },
    { id: 'clubhouse', label: 'Clubhouse', score: ratingAggregates?.avg_clubhouse_score },
    { id: 'facilities', label: 'Facilities', score: ratingAggregates?.avg_facilities_score },
  ].filter((cat) => cat.score !== null && cat.score !== undefined);

  const hasDistribution = distribution && (
    distribution.outstanding > 0 ||
    distribution.excellent > 0 ||
    distribution.veryGood > 0 ||
    distribution.good > 0 ||
    distribution.fair > 0
  );

  const getCommunityHighlights = () => {
    if (categories.length === 0) return null;
    const sorted = [...categories]
      .filter(c => c.score && c.score >= 9.0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    if (sorted.length === 0) return null;
    return sorted.map(c => c.label);
  };

  const highlights = getCommunityHighlights();

  const circumference = 2 * Math.PI * 42;
  const progress = isVisible ? (communityAverage / 10) * circumference : 0;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Community Rating</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
            </p>
            {onlyUserHasRated && (
              <p className="mt-2 text-sm text-muted-foreground">
                Only you have rated this course so far.
              </p>
            )}
          </div>
          
          {/* Large animated score ring */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90">
                <circle cx="48" cy="48" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <circle 
                  cx="48" cy="48" r="42" fill="none" 
                  stroke="url(#communityScoreGradient)" 
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${progress} ${circumference}`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="communityScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    {communityAverage >= 9 ? (
                      <>
                       <stop offset="0%" stopColor="#f59e0b" />
                       <stop offset="100%" stopColor="#fbbf24" />
                      </>
                    ) : (
                      <>
                       <stop offset="0%" stopColor="#d1d5db" />
                       <stop offset="100%" stopColor="#d1d5db" />
                      </>
                    )}
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-foreground tabular-nums leading-none">
                  {formatScore(communityAverage)}
                </span>
              </div>
            </div>
            <span 
              className={cn(
                "mt-2 text-base font-semibold uppercase tracking-wide",
                communityAverage >= 9 ? "text-[#d97706]" : "text-muted-foreground"
              )}
            >
              {tierLabel}
            </span>
          </div>
        </div>
      </div>
      
      {/* Highlights */}
      {highlights && highlights.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Highlights
          </p>
          <div className="flex flex-wrap gap-2">
            {highlights.map(h => (
              <span 
                key={h}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* User vs community comparison */}
      {comparisonMessage && (
        <div className="px-5 pb-4">
          {comparisonMessage}
        </div>
      )}

      {/* Distribution */}
      {hasDistribution && (
        <div className="border-t border-border p-5">
          <RatingTierDistribution distribution={distribution} />
        </div>
      )}

      {/* Category breakdown */}
      {categories.length > 0 && (
        <div className="border-t border-border p-5 grid grid-cols-2 gap-4">
          {categories.map((cat) => {
            const score = cat.score || 0;
            const isOutstandingCat = score >= 9;
            const barColorClass = isOutstandingCat 
             ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]' 
             : 'bg-[#d1d5db]';
            
            return (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{cat.label}</span>
                  <span className="font-semibold text-foreground tabular-nums">{formatScore(score)}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${barColorClass} rounded-full transition-all duration-700`}
                    style={{ width: `${(score / 10) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* See all reviews link */}
      {onSeeAllReviews && (
        <button 
          type="button"
          onClick={onSeeAllReviews}
          className="w-full p-4 border-t border-border flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-[0.98]"
        >
          See all reviews
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default CommunityScoreCard;

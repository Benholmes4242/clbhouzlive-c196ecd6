import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon, Sparkles } from 'lucide-react';
import { CourseRatingAggregate } from '@/hooks/useCourseRatingAggregates';
import { UserCourseRating } from '@/hooks/useUserCourseRating';

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
      <div
        className="flex items-center gap-3.5 p-4 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(247,147,30,0.06), rgba(247,147,30,0.02))',
          border: '1.5px solid rgba(247,147,30,0.15)',
        }}
      >
        <div
          className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #F7931E, #FBBC2E)' }}
        >
          <span style={{ fontSize: 20 }}>⭐</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-foreground">No ratings yet</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Be the first to rate{courseName ? ` ${courseName}` : ' this course'}
          </p>
        </div>
        <button
          onClick={onRateClick}
          className="flex-shrink-0 px-4 py-2 rounded-[10px] text-[13px] font-bold text-white active:scale-[0.97] transition-all"
          style={{ background: '#F7931E' }}
        >
          Rate
        </button>
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
    { id: 'clubhouse', label: 'clubhouse', score: ratingAggregates?.avg_clubhouse_score },
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

  return (
    <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
      {/* Dispatch rule marker */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>Community Rating</span>
        </div>
      </div>

      {/* Score — flat, no ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 0', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {formatScore(communityAverage)}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
              {tierLabel}
            </span>
          </div>
          <p style={{ fontSize: 11, color: '#94A3B8' }}>
            Based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
          </p>
          {onlyUserHasRated && (
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Only you have rated this course so far.</p>
          )}
        </div>
      </div>

      {/* Highlights */}
      {highlights && highlights.length > 0 && (
        <div style={{ padding: '12px 16px 0' }}>
          <p style={{ fontSize: 9, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
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
        <div style={{ padding: '0 16px 12px' }}>
          {comparisonMessage}
        </div>
      )}

      {/* Distribution */}
      {hasDistribution && (
        <div style={{ borderTop: '0.5px solid rgba(15,23,42,0.07)', padding: '12px 16px' }}>
          <RatingTierDistribution distribution={distribution} />
        </div>
      )}

      {/* Category breakdown — 4-col grid */}
      {categories.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
          {categories.map((cat, i) => (
            <div key={cat.id} style={{ padding: '9px 0', textAlign: 'center' as const, borderRight: i < categories.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none' }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 2 }}>
                {cat.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                {formatScore(cat.score || 0)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* See all reviews */}
      {onSeeAllReviews && (
        <button
          type="button"
          onClick={onSeeAllReviews}
          style={{ width: '100%', padding: '11px 0', background: 'transparent', border: 'none', borderTop: '0.5px solid rgba(15,23,42,0.07)', fontSize: 12, fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}
        >
          See all reviews →
        </button>
      )}
    </div>
  );
};

export default CommunityScoreCard;
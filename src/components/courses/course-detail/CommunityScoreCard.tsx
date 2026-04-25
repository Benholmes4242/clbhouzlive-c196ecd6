import React from 'react';
import { CheckCircle2, ArrowUp as ArrowUpIcon, ArrowDown as ArrowDownIcon } from 'lucide-react';
import { CourseRatingAggregate } from '@/hooks/useCourseRatingAggregates';
import { UserCourseRating } from '@/hooks/useUserCourseRating';
import { RatingTierDistributionData } from '@/components/courses/review/RatingTierDistribution';
import { getRatingTier } from '@/lib/ratingTier';

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

const TIERS: { key: keyof RatingTierDistributionData; label: string }[] = [
  { key: 'exceptional', label: 'Exceptional' },
  { key: 'excellent', label: 'Excellent' },
  { key: 'good', label: 'Good' },
  { key: 'fair', label: 'Fair' },
  { key: 'poor', label: 'Poor' },
];

const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 50 }) => {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const fill = circ * (Math.max(0, Math.min(10, score)) / 10);
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(15,23,42,0.06)"
          strokeWidth={3.5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#F7931E"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 900,
          color: '#0F172A',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {score.toFixed(1)}
      </div>
    </div>
  );
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
  const tierLabel = getRatingTier(communityAverage);

  // Empty state — flat copy line, no card
  if (totalRatings === 0) {
    return (
      <div>
        <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.6, textAlign: 'center' as const }}>
          No ratings yet — be the first to rate {courseName || 'this course'}.
        </p>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: '#22C55E' }} />
          <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>
            Your score matches the community consensus.
          </span>
        </div>
      );
    } else if (diff > 0) {
      comparisonMessage = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <ArrowUpIcon className="h-3.5 w-3.5" style={{ color: '#22C55E' }} />
          <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>
            You rated this course {absDiff.toFixed(1)} points higher than the community.
          </span>
        </div>
      );
    } else {
      comparisonMessage = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <ArrowDownIcon className="h-3.5 w-3.5" style={{ color: '#EF4444' }} />
          <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>
            You rated this course {absDiff.toFixed(1)} points lower than the community.
          </span>
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

  // Distribution counts (fallback to zeros)
  const distCounts: Record<string, number> = {
    exceptional: distribution?.exceptional ?? 0,
    excellent: distribution?.excellent ?? 0,
    good: distribution?.good ?? 0,
    fair: distribution?.fair ?? 0,
    poor: distribution?.poor ?? 0,
  };
  const maxCount = Math.max(...Object.values(distCounts), 1);

  return (
    <div>
      {/* Score block — stacked & centered (number above tier label) */}
      <div style={{ textAlign: 'center' as const, marginBottom: 6 }}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '-0.05em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatScore(communityAverage)}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#c97a10',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            marginTop: 6,
          }}
        >
          {tierLabel}
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 14, textAlign: 'center' as const }}>
        Based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
        {onlyUserHasRated ? ' · Only you have rated this course so far.' : ''}
      </div>

      {/* User vs community comparison */}
      {comparisonMessage}

      {/* Distribution bars */}
      <div style={{ marginBottom: 14 }}>
        {TIERS.map(({ key, label }) => {
          const count = distCounts[key] || 0;
          const pct = (count / maxCount) * 100;
          return (
            <div
              key={key}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}
            >
              <span style={{ fontSize: 11, color: '#64748B', width: 90, flexShrink: 0 }}>{label}</span>
              <div
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(15,23,42,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: '#F7931E',
                    borderRadius: 2,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: '#94A3B8', width: 14, textAlign: 'right' as const }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Category breakdown — eyebrow + score rings */}
      {categories.length > 0 && (
        <>
          {/* Eyebrow tying breakdown to histogram */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#94A3B8',
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              textAlign: 'center' as const,
              marginTop: 8,
              paddingTop: 16,
              borderTop: '0.5px solid rgba(15,23,42,0.07)',
              marginBottom: 10,
            }}
          >
            Category Scores
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${categories.length}, 1fr)`,
              gap: 8,
            }}
          >
            {categories.map((cat) => (
              <div key={cat.id} style={{ textAlign: 'center' as const }}>
                <ScoreRing score={cat.score || 0} size={50} />
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: '#94A3B8',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                    marginTop: 6,
                  }}
                >
                  {cat.label}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* See all reviews — quiet text link */}
      {onSeeAllReviews && (
        <button
          type="button"
          onClick={onSeeAllReviews}
          style={{
            width: '100%',
            padding: '14px 0 4px',
            background: 'none',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            color: '#94A3B8',
            cursor: 'pointer',
          }}
        >
          See all reviews →
        </button>
      )}
    </div>
  );
};

export default CommunityScoreCard;

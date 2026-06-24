import React from 'react';
import { CourseRatingAggregate } from '@/hooks/useCourseRatingAggregates';
import { UserCourseRating } from '@/hooks/useUserCourseRating';
import { RatingTierDistributionData } from '@/components/courses/review/RatingTierDistribution';
import {
  getRatingTier,
  HERO_NUMBER_STYLE,
  TIER_LABEL_STYLE,
  ratingTextColor,
  rampForRating,
} from '@/lib/ratingTier';
import { AMBER, HAIRLINE_INK_7, INK, INK_FAINT, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';

// Representative score per distribution tier — drives bar colour via rampForRating
const TIER_REP_SCORE: Record<string, number> = {
  exceptional: 9.5,
  excellent: 8.0,
  good: 6.5,
  fair: 5.0,
  poor: 2.0,
};

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
          ...HERO_NUMBER_STYLE,
          color: ratingTextColor(score),
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

  // Empty state — invitation card with 0–10 numeric language
  if (totalRatings === 0) {
    return (
      <div
        style={{
          background: SURFACE,
          borderRadius: 20,
          border: `1px solid ${HAIRLINE_INK_7}`,
          padding: '28px 24px',
          textAlign: 'center' as const,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, marginBottom: 14 }}>
          <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', color: 'rgba(247,147,30,0.30)', lineHeight: 1 }}>–</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'rgba(15,23,42,0.25)', letterSpacing: '-0.02em' }}>/10</span>
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: INK, letterSpacing: '-0.02em', marginBottom: 5 }}>
          Be the first to rate this course
        </div>
        <p style={{ fontSize: 13, color: INK_MUTE, lineHeight: 1.5, maxWidth: 260, margin: '0 auto 18px' }}>
          No one's scored {courseName || 'this course'} yet. Give it a 0–10 and help fellow golfers discover it.
        </p>
        <button
          type="button"
          onClick={onRateClick}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: 13,
            background: AMBER,
            border: 'none',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(247,147,30,0.28)',
          }}
        >
          Rate this course
        </button>
      </div>
    );
  }

  const onlyUserHasRated = totalRatings === 1 && userRating;


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
    <div
      style={{
        background: SURFACE,
        borderRadius: 20,
        border: `1px solid ${HAIRLINE_INK_7}`,
        padding: '24px 20px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      }}
    >
      {/* Score header — number left, tier/count/comparison stacked right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 58,
              ...HERO_NUMBER_STYLE,
              color: ratingTextColor(communityAverage),
              lineHeight: 1,
            }}
          >
            {formatScore(communityAverage)}
          </span>
          <span style={{ fontSize: 19, fontWeight: 800, color: 'rgba(15,23,42,0.25)', letterSpacing: '-0.02em' }}>
            /10
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 7 }}>
          <div>
            <div style={{ fontSize: 12, ...TIER_LABEL_STYLE, color: ratingTextColor(communityAverage) }}>
              {tierLabel}
            </div>
            <div style={{ fontSize: 11.5, color: INK_FAINT, marginTop: 2 }}>
              Based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
              {onlyUserHasRated ? ' · Only you' : ''}
            </div>
          </div>
        </div>

      </div>


      {/* Distribution bars — taller, gradient, zero tiers de-emphasised */}
      <div style={{ marginBottom: 14 }}>
        {TIERS.map(({ key, label }) => {
          const count = distCounts[key] || 0;
          const pct = (count / maxCount) * 100;
          const has = count > 0;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 11.5,
                  color: has ? INK : INK_FAINT,
                  fontWeight: has ? 600 : 500,
                  width: 82,
                  flexShrink: 0,
                }}
              >
                {label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 7,
                  borderRadius: 4,
                  background: 'rgba(15,23,42,0.05)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: has ? 'linear-gradient(90deg, #F7931E, #FFB347)' : 'transparent',
                    borderRadius: 4,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: has ? INK : 'rgba(15,23,42,0.25)',
                  fontWeight: has ? 800 : 600,
                  width: 16,
                  textAlign: 'right' as const,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Category breakdown — eyebrow + score rings */}
      {categories.length > 0 && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: INK_FAINT,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              textAlign: 'center' as const,
              marginTop: 8,
              paddingTop: 16,
              borderTop: `0.5px solid ${HAIRLINE_INK_7}`,
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
                    color: INK_FAINT,
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
            color: INK_FAINT,
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

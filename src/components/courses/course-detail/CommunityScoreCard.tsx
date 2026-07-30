import React from 'react';
import { useTranslation } from 'react-i18next';

import { CourseRatingAggregate } from '@/hooks/useCourseRatingAggregates';
import { UserCourseRating } from '@/hooks/useUserCourseRating';
import { RatingTierDistributionData } from '@/components/courses/review/RatingTierDistribution';
import {
  getRatingTier,
  HERO_NUMBER_STYLE,
  TIER_LABEL_STYLE,
  rampForRating,
} from '@/lib/ratingTier';
import { SubScoreBar, bandColor } from '@/features/courses/_shared/scoreBands';
import { AMBER, HAIRLINE_INK_7, INK, INK_FAINT, INK_MUTE, SURFACE } from '@/features/courses/_shared/tokens';
import { useTop100Config } from '@/hooks/top100/useTop100Config';


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

const TIERS: { key: keyof RatingTierDistributionData; labelKey: string }[] = [
  { key: 'exceptional', labelKey: 'review.filter.optionExceptional' },
  { key: 'excellent', labelKey: 'review.filter.optionExcellent' },
  { key: 'good', labelKey: 'review.filter.optionGood' },
  { key: 'fair', labelKey: 'review.filter.optionFair' },
  { key: 'poor', labelKey: 'review.filter.optionPoor' },
];


const CommunityScoreCard: React.FC<CommunityScoreCardProps> = ({
  courseName,
  ratingAggregates,
  userRating,
  distribution,
  onRateClick,
  onSeeAllReviews,
}) => {
  const { t } = useTranslation('courses');
  const { subscoreMinRatings } = useTop100Config();
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
          <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', color: 'rgba(247,147,30,0.30)', lineHeight: 1 }}>{t('courseDetail.communityScore.dashPlaceholder')}</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'rgba(15,23,42,0.25)', letterSpacing: '-0.02em' }}>/10</span>
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: INK, letterSpacing: '-0.02em', marginBottom: 5 }}>
          {t('courseDetail.communityScore.beFirst')}
        </div>
        <p style={{ fontSize: 13, color: INK_MUTE, lineHeight: 1.5, maxWidth: 260, margin: '0 auto 18px' }}>
          {t('courseDetail.communityScore.noOneRated', { courseName: courseName || t('courseDetail.communityScore.thisCourse') })}
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
          {t('courseDetail.communityScore.rateThis')}
        </button>
      </div>
    );
  }

  const onlyUserHasRated = totalRatings === 1 && userRating;


  // Sub-scores are gated behind the SAME threshold the Top 100 panel uses
  // (t100_subscore_min_ratings, default 3). One number, both surfaces move
  // together. Below it: headline, tier, distribution and count only.
  const categories =
    totalRatings >= subscoreMinRatings
      ? [
          { id: 'design', labelKey: 'review.subscore.design', score: ratingAggregates?.avg_design_score },
          { id: 'condition', labelKey: 'review.subscore.condition', score: ratingAggregates?.avg_condition_score },
          { id: 'facilities', labelKey: 'review.subscore.facilities', score: ratingAggregates?.avg_facilities_score },
          { id: 'clubhouse', labelKey: 'review.subscore.clubhouse', score: ratingAggregates?.avg_clubhouse_score },
        ].filter((cat) => cat.score !== null && cat.score !== undefined)
      : [];




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
              color: bandColor(communityAverage),
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
            <div
              style={{
                fontSize: 12,
                ...TIER_LABEL_STYLE,
                color: bandColor(communityAverage),
              }}
            >
              {tierLabel}
            </div>
            <div style={{ fontSize: 11.5, color: INK_FAINT, marginTop: 2 }}>
              {t('courseDetail.communityScore.basedOn', { count: totalRatings })}
              {onlyUserHasRated ? t('courseDetail.communityScore.onlyYouSuffix') : ''}
            </div>
          </div>
        </div>

      </div>


      {/* Distribution bars — taller, gradient, zero tiers de-emphasised */}
      <div style={{ marginBottom: 14 }}>
        {TIERS.map(({ key, labelKey }) => {
          const count = distCounts[key] || 0;
          const pct = (count / maxCount) * 100;
          const has = count > 0;
          const isExceptionalRow = key === 'exceptional' && has;
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
                {t(labelKey)}
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
                  className={isExceptionalRow ? 'clbhouz-gold-shimmer-bar' : undefined}
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: isExceptionalRow
                      ? undefined
                      : has
                        ? (() => {
                            const ramp = rampForRating(TIER_REP_SCORE[key as string] ?? 0);
                            return `linear-gradient(90deg, ${ramp.lo}, ${ramp.hi})`;
                          })()
                        : 'transparent',
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
            {t('courseDetail.communityScore.categoryScores')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              {categories.slice(0, 2).map((cat) => (
                <SubScoreBar key={cat.id} label={t(cat.labelKey)} score={cat.score || 0} />
              ))}
            </div>
            {categories.length > 2 && (
              <div style={{ display: 'flex', gap: 16 }}>
                {categories.slice(2, 4).map((cat) => (
                  <SubScoreBar key={cat.id} label={t(cat.labelKey)} score={cat.score || 0} />
                ))}
              </div>
            )}
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
          {t('courseDetail.communityScore.seeAllReviews')}
        </button>
      )}
    </div>
  );
};

export default CommunityScoreCard;

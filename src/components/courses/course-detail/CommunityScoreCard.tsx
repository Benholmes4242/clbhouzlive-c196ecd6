/**
 * CommunityScoreCard - Block 3b of the Course tab.
 *
 * Analytical treatment (BRIEF_COURSE_TAB_LOWER_BLOCKS):
 *   - headline trio: community overall, your rating, friends average
 *   - distribution bars use FLAT band colours (no gradients, no shimmer)
 *   - sub-scores stay gated behind t100_subscore_min_ratings
 *   - actions are quiet uppercase text affordances, never filled pills
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

import { CourseRatingAggregate } from '@/hooks/useCourseRatingAggregates';
import { UserCourseRating } from '@/hooks/useUserCourseRating';
import { RatingTierDistributionData } from '@/components/courses/review/RatingTierDistribution';
import { getRatingTier, TIER_LABEL_STYLE } from '@/lib/ratingTier';
import { SubScoreBar, bandColor } from '@/features/courses/_shared/scoreBands';
import { useTop100Config } from '@/hooks/top100/useTop100Config';
import { A, Action, LABEL, NUM, Panel, EmptyState } from '@/features/courses/components/holes/analytical/tokens';

// Representative score per distribution tier — drives the flat bar colour
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
  /** Average of friends' overall ratings, when any friend has rated. */
  friendsAvg?: number | null;
  /** True while the rating aggregates query is in flight. Blocks the empty state. */
  isLoading?: boolean;
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
  friendsAvg = null,
  isLoading = false,
  onRateClick,
  onSeeAllReviews,
}) => {
  const { t } = useTranslation('courses');
  const { subscoreMinRatings } = useTop100Config();
  const totalRatings = ratingAggregates?.review_count || 0;
  const communityAverage = ratingAggregates?.avg_overall_score || 0;
  const tierLabel = getRatingTier(communityAverage);

  // While the aggregates are in flight, totalRatings reads 0 and the empty state
  // would state something untrue. Skeleton until the query settles.
  if (isLoading) {
    return <Skeleton className="h-[128px] w-full rounded-[16px]" />;
  }

  // Empty state — invitation panel with 0-10 numeric language
  if (totalRatings === 0) {
    return (
      <EmptyState
        kicker={t('courseDetail.rating.kicker')}
        title={t('courseDetail.communityScore.beFirst')}
        body={t('courseDetail.communityScore.noOneRated', {
          courseName: courseName || t('courseDetail.communityScore.thisCourse'),
        })}
        action={{ label: t('courseDetail.communityScore.rateThis'), onClick: onRateClick }}
      />
    );
  }

  const onlyUserHasRated = totalRatings === 1 && userRating;

  // Sub-scores are gated behind the SAME threshold the Top 100 panel uses
  // (t100_subscore_min_ratings, default 3).
  const categories =
    totalRatings >= subscoreMinRatings
      ? [
          { id: 'design', labelKey: 'review.subscore.design', score: ratingAggregates?.avg_design_score },
          { id: 'condition', labelKey: 'review.subscore.condition', score: ratingAggregates?.avg_condition_score },
          { id: 'facilities', labelKey: 'review.subscore.facilities', score: ratingAggregates?.avg_facilities_score },
          { id: 'clubhouse', labelKey: 'review.subscore.clubhouse', score: ratingAggregates?.avg_clubhouse_score },
        ].filter((cat) => cat.score !== null && cat.score !== undefined)
      : [];

  const distCounts: Record<string, number> = {
    exceptional: distribution?.exceptional ?? 0,
    excellent: distribution?.excellent ?? 0,
    good: distribution?.good ?? 0,
    fair: distribution?.fair ?? 0,
    poor: distribution?.poor ?? 0,
  };
  const maxCount = Math.max(...Object.values(distCounts), 1);

  const yourScore = userRating?.rating ?? null;

  const headline: { label: string; value: string; tone: string; tier?: string }[] = [
    {
      label: t('courseDetail.rating.overall'),
      value: formatScore(communityAverage),
      tone: bandColor(communityAverage),
      tier: tierLabel,
    },
  ];
  if (yourScore != null) {
    headline.push({
      label: t('courseDetail.rating.yours'),
      value: formatScore(yourScore),
      tone: A.AMBER_DEEP,
    });
  }
  if (friendsAvg != null && Number.isFinite(friendsAvg)) {
    headline.push({
      label: t('courseDetail.rating.friends'),
      value: formatScore(friendsAvg),
      tone: A.INK,
    });
  }

  return (
    <Panel
      kicker={t('courseDetail.rating.kicker')}
      aside={`${t('courseDetail.communityScore.basedOn', { count: totalRatings })}${
        onlyUserHasRated ? t('courseDetail.communityScore.onlyYouSuffix') : ''
      }`}
    >
      {/* Headline trio */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${headline.length}, minmax(0, 1fr))`,
          gap: 8,
          justifyItems: 'center',
          marginBottom: 16,
        }}
      >
        {headline.map((h) => (
          <div key={h.label} style={{ minWidth: 0, textAlign: 'center' }}>
            <div style={LABEL}>{h.label}</div>
            <div style={{ ...NUM, fontSize: 30, color: h.tone, marginTop: 4, lineHeight: 1, whiteSpace: 'nowrap' }}>
              {h.value}
            </div>
            {h.tier ? (
              <div style={{ ...TIER_LABEL_STYLE, fontSize: 11, color: h.tone, marginTop: 4, textAlign: 'center' }}>
                {h.tier}
              </div>
            ) : null}
          </div>
        ))}
      </div>



      {/* Distribution — flat band colours, no gradients or shimmer */}
      <div style={{ display: 'grid', gap: 8 }}>
        {TIERS.map(({ key, labelKey }) => {
          const count = distCounts[key] || 0;
          const pct = (count / maxCount) * 100;
          const has = count > 0;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: 11.5,
                  color: has ? A.INK : A.DIM,
                  fontWeight: has ? 600 : 500,
                  width: 82,
                  flexShrink: 0,
                }}
              >
                {t(labelKey)}
              </span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: A.TRACK, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: has ? bandColor(TIER_REP_SCORE[key as string] ?? 0) : 'transparent',
                    borderRadius: 3,
                  }}
                />
              </div>
              <span
                style={{
                  ...NUM,
                  fontSize: 12,
                  color: has ? A.INK : A.DIM,
                  width: 16,
                  textAlign: 'right',
                }}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <>
          <div style={{ ...LABEL, marginTop: 18, marginBottom: 10 }}>
            {t('courseDetail.communityScore.categoryScores')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

      {/* Actions — quiet text affordances */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <Action
          label={yourScore != null ? t('courseDetail.about.editRating') : t('courseDetail.communityScore.rateThis')}
          onClick={onRateClick}
          align="left"
        />
        {onSeeAllReviews && (
          <Action
            label={t('courseDetail.communityScore.seeAllReviews')}
            onClick={onSeeAllReviews}
            tone={A.MUTE}
          />
        )}
      </div>
    </Panel>
  );
};

export default CommunityScoreCard;

/**
 * BRIEF_COURSE_TAB_REBUILD §3.6 — WHAT PEOPLE SAY, flat.
 *
 * TWO MOVES IN ONE SECTION:
 *
 *   STAYS HERE — the community score and the viewing member's own score. That
 *   is the whole of it. On a tab a member reads to decide whether to play here,
 *   one figure and their own figure is the answer.
 *
 *   MOVES TO THE REVIEWS TAB — the five-bar histogram and the four category
 *   scores. Neither is deleted: the histogram already renders on that tab as a
 *   tappable filter, and the category scores render there now too. A histogram
 *   whose bars filter a list belongs beside the list, not two tabs away.
 *
 *   NOT HERE AT ALL — the friends average. It was a third headline figure on a
 *   section that is meant to carry two; the friends strip below already names
 *   the people.
 *
 * THIN STATE, BUILT WITH THE FULL ONE: under five ratings the score shows with
 * "From 2 ratings — too few to be settled." beneath it, and no tier word. A
 * tier label on two ratings claims a verdict the sample cannot support.
 *
 * COLOUR: the community figure takes its score band; the viewer's own figure is
 * amber, which on this platform means the viewing member and nothing else.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { getRatingTier, TIER_LABEL_STYLE } from '@/lib/ratingTier';
import { bandColor } from '@/features/courses/_shared/scoreBands';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection, { ABOUT_KICKER, AboutHairline, aboutFig } from './AboutSection';

/** Below this the score is shown but not called settled. */
export const SETTLED_MIN_RATINGS = 5;

interface WhatPeopleSayProps {
  courseId: string;
  courseName: string;
  onRateClick: () => void;
  /** Opens the Reviews tab, where the histogram and category scores live. */
  onSeeAllReviews?: () => void;
}

const Figure: React.FC<{ label: string; value: string; tone: string; tier?: string | null }> = ({
  label,
  value,
  tone,
  tier,
}) => (
  <div style={{ minWidth: 0 }}>
    <div style={ABOUT_KICKER}>{label}</div>
    <div style={{ ...aboutFig(30, tone), marginTop: 4, lineHeight: 1, whiteSpace: 'nowrap' }}>{value}</div>
    {tier ? (
      <div style={{ ...TIER_LABEL_STYLE, fontSize: 11, color: tone, marginTop: 4 }}>{tier}</div>
    ) : null}
  </div>
);

const WhatPeopleSay: React.FC<WhatPeopleSayProps> = ({
  courseId,
  courseName,
  onRateClick,
  onSeeAllReviews,
}) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const { data: aggregates, isLoading } = useCourseRatingAggregates(courseId);
  const { data: userRating } = useUserCourseRating(courseId, user?.id);

  const heading = t('courseDetail.sections.whatPeopleSay');
  const total = aggregates?.review_count ?? 0;
  const score = aggregates?.avg_overall_score ?? 0;
  const yours = userRating?.rating ?? null;

  const rateAction = (
    <button
      type="button"
      onClick={onRateClick}
      style={{
        display: 'block',
        marginTop: 14,
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: 'pointer',
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 600,
        color: A.INK,
        textAlign: 'left',
      }}
    >
      {yours != null ? t('courseDetail.about.editRating') : t('courseDetail.communityScore.rateThis')}
    </button>
  );

  // The aggregates are in flight: 0 would state something untrue.
  if (isLoading) return null;

  // NOBODY HAS SCORED IT — a sentence and an invitation, not a card.
  if (total === 0) {
    return (
      <AboutSection heading={heading}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, fontWeight: 600, color: A.MUTE, fontFamily: SANS }}>
          {t('courseDetail.communityScore.noOneRated', { courseName })}
        </p>
        {rateAction}
      </AboutSection>
    );
  }

  const settled = total >= SETTLED_MIN_RATINGS;

  return (
    <AboutSection heading={heading} meta={t('courseDetail.communityScore.basedOn', { count: total })}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40 }}>
        <Figure
          label={t('courseDetail.rating.overall')}
          value={score.toFixed(1)}
          tone={bandColor(score)}
          tier={settled ? getRatingTier(score) : null}
        />
        {yours != null ? (
          <Figure
            label={t('courseDetail.rating.yours')}
            value={yours.toFixed(1)}
            tone={A.AMBER_DEEP}
          />
        ) : null}
      </div>

      {/* THE THIN SENTENCE — the sample is named and its limit stated. */}
      {!settled ? (
        <p style={{ margin: '10px 0 0', fontSize: 11.5, lineHeight: 1.5, fontWeight: 600, color: A.MUTE }}>
          {t('courseDetail.rating.tooFew', { count: total })}
        </p>
      ) : null}

      {rateAction}

      {onSeeAllReviews ? (
        <>
          <AboutHairline style={{ marginTop: 18 }} />
          <button
            type="button"
            onClick={onSeeAllReviews}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: 'transparent',
              border: 0,
              padding: '14px 0 0',
              cursor: 'pointer',
              fontFamily: SANS,
            }}
          >
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: A.INK }}>
              {t('courseDetail.communityScore.seeAllReviews')} ›
            </span>
            <span style={{ display: 'block', marginTop: 5, fontSize: 11, lineHeight: 1.5, color: A.DIM }}>
              {t('courseDetail.rating.allReviewsSub')}
            </span>
          </button>
        </>
      ) : null}
    </AboutSection>
  );
};

export default WhatPeopleSay;

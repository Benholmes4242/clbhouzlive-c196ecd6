/**
 * BRIEF_C1.2 (18 Sep 2026) — WHAT PEOPLE SAY, flat.
 *
 * The four aggregate category scores live on BOTH the Course and Reviews tabs.
 * They render from the first rating onward because an aggregate from one rating
 * is still factual; the rating count does the honest qualification. Only
 * the tier word stays gated below five ratings because it makes a verdict.
 *
 *   NOT HERE AT ALL — the friends average. It was a third headline figure on a
 *   section that is meant to carry two; the friends strip below already names
 *   the people.
 *
 * THIN STATE, BUILT WITH THE FULL ONE: under five ratings the score and its
 * rating count show exactly as they do when settled, and only the tier word is
 * withheld. A tier label on two ratings claims a verdict the sample cannot
 * support; the rating count beside the score lets the reader judge the weight
 * for themselves.
 *
 * COLOUR: the community figure takes its score band. The rating count is
 * right-aligned in the slot where the viewer's amber "Your rating" figure sat;
 * the viewer's own score is not shown here.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { CategoryScores, OverallScoreLine } from '../CategoryScores';
import AboutSection, { ABOUT_KICKER, AboutHairline } from './AboutSection';

export { SETTLED_MIN_RATINGS } from '../CategoryScores';

interface WhatPeopleSayProps {
  courseId: string;
  courseName: string;
  onRateClick: () => void;
  /** Opens the Reviews tab, where the category scores also live beside reviews. */
  onSeeAllReviews?: () => void;
}

/** The rating count, right-aligned in the slot where "Your rating" used to sit. */
const CountSlot: React.FC<{ count: number }> = ({ count }) => {
  const { t } = useTranslation('courses');
  return (
    <div style={{ minWidth: 0, flexShrink: 0, textAlign: 'right', paddingBottom: 2 }}>
      <span style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, lineHeight: 1.35, color: A.MUTE }}>
        {t('courseDetail.communityScore.basedOn', { count })}
      </span>
    </div>
  );
};

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
        display: 'inline-block',
        marginTop: 14,
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${A.BORDER}`,
        borderRadius: 11,
        padding: '8px 14px',
        cursor: 'pointer',
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 700,
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

  return (
    <AboutSection heading={heading}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <OverallScoreLine score={score} ratingCount={total} />
        </div>
        <CountSlot count={total} />
      </div>

      <CategoryScores
        marginTop={16}
        scores={{
          design: aggregates?.avg_design_score,
          condition: aggregates?.avg_condition_score,
          clubhouse: aggregates?.avg_clubhouse_score,
          facilities: aggregates?.avg_facilities_score,
        }}
      />

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

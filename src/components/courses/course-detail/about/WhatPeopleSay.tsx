/**
 * BRIEF_C1.2 (18 Sep 2026) — WHAT PEOPLE SAY, flat.
 *
 * The four aggregate category scores live on BOTH the Course and Reviews tabs.
 * They render from the first rating onward because an aggregate from one rating
 * is still factual; the thin-sample caveat does the honest qualification. Only
 * the tier word stays gated below five ratings because it makes a verdict.
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
import { bandColorOnDark } from '@/features/courses/_shared/scoreBands';
import { A, SANS, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection, { ABOUT_KICKER, AboutHairline, aboutFig } from './AboutSection';

/** Below this the score is shown but not called settled. */
export const SETTLED_MIN_RATINGS = 5;

interface WhatPeopleSayProps {
  courseId: string;
  courseName: string;
  onRateClick: () => void;
  /** Opens the Reviews tab, where the category scores also live beside reviews. */
  onSeeAllReviews?: () => void;
}

const Figure: React.FC<{
  label: string;
  value: string;
  tone: string;
  size?: number;
  tier?: string | null;
}> = ({ label, value, tone, size = 34, tier }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ ...aboutFig(size, tone), lineHeight: 1, whiteSpace: 'nowrap' }}>{value}</div>
    <div style={{ ...ABOUT_KICKER, marginTop: 6 }}>{label}</div>
    {tier ? (
      <div style={{ ...TIER_LABEL_STYLE, fontSize: 11, color: tone, marginTop: 4 }}>{tier}</div>
    ) : null}
  </div>
);

const CATEGORY_FIGURES = [
  { key: 'avg_design_score', label: 'Design' },
  { key: 'avg_condition_score', label: 'Condition' },
  { key: 'avg_clubhouse_score', label: 'Clubhouse' },
  { key: 'avg_facilities_score', label: 'Facilities' },
] as const;

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
  const categoryFigures = CATEGORY_FIGURES.flatMap(({ key, label }) => {
    const value = aggregates?.[key];
    return value == null ? [] : [{ key, label, value }];
  });

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
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
        <Figure
          label={t('courseDetail.rating.overall')}
          value={score.toFixed(1)}
          tone={bandColorOnDark(score)}
          tier={settled ? getRatingTier(score) : null}
        />
        {yours != null ? (
          <Figure
            label={t('courseDetail.rating.yours')}
            value={yours.toFixed(1)}
            tone={A.AMBER_DEEP}
            size={22}
          />
        ) : null}
      </div>

      {categoryFigures.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${categoryFigures.length}, minmax(0, 1fr))`,
            gap: 12,
            marginTop: 16,
          }}
        >
          {categoryFigures.map(({ key, label, value }) => (
            <div key={key} style={{ minWidth: 0 }}>
              <div style={{ ...aboutFig(15, courseSubScoreTone(value)), lineHeight: 1 }}>
                {value.toFixed(1)}
              </div>
              <div style={{ ...ABOUT_KICKER, marginTop: 5 }}>{label}</div>
            </div>
          ))}
        </div>
      ) : null}

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

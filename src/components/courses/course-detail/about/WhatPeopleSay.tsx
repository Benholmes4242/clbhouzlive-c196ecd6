/**
 * CRM1 — WHAT PEOPLE SAY reads the Reviews tab's source.
 *
 * Every figure comes from the SAME community sample the Reviews tab uses:
 * useCourseReviewSample + reviewsCommunitySample, wired exactly as
 * CourseReviewsTab wires it. The sample EXCLUDES the viewer, whose own score
 * appears separately as the amber YOU pill — so both tabs print the same
 * numbers for the same course. useCourseRatingAggregates and
 * useUserCourseRating are no longer read here.
 *
 * FIGURE BLOCK (CRM1.3/1.4, gated by CRM2.1): the Reviews tab's arrangement —
 * 48px ink score, tier word over the numeral rating count beside it, both ink
 * (no courseSubScoreTone), and the amber YOU pill at the right-hand end when
 * the viewer has rated and a delta exists. The tier word renders only at two
 * or more community ratings (hasCommunityAverage, the same gate the Reviews
 * tab enforces); at one community rating its slot collapses entirely.
 *
 * ERROR (CRM2.2): a failed fetch renders NOTHING, exactly like loading — the
 * "No one's scored yet" invitation may only run on a successful empty fetch.
 *
 * CATEGORY BARS (CRM1.5/1.6, 2×2 grid): the shared CategoryBarGrid renders
 * directly beneath the figure block whenever there are at least two community
 * ratings, at every count above; below two, nothing takes its place. The
 * CategoryScores "pairs" block is removed from this component only.
 *
 * ONLY-RATER STATE (CRM1.7b): when the single rating is the viewer's own,
 * there is no community figure — the section says so and shows the viewer's
 * score in amber instead.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCourseReviewSample } from '@/hooks/useCourseReviewSample';
import { reviewsCommunitySample } from '@/lib/reviews/communitySample';
import { fewReviewFacts } from '@/lib/reviews/fewReviews';
import { hasCommunityAverage } from '@/lib/reviews/sampleRules';
import { getRatingTierLabel } from '@/lib/ratingTier';
import { SURFACE } from '@/lib/tokens/surface';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { CategoryBarGrid } from '@/components/shared/CategoryBarGrid';
import AboutSection, { AboutHairline } from './AboutSection';
import { shotsInWords } from './courseVerdict';

interface WhatPeopleSayProps {
  courseId: string;
  courseName: string;
  onRateClick: () => void;
  /** Opens the Reviews tab, where the same community figures live beside reviews. */
  onSeeAllReviews?: () => void;
}

const WhatPeopleSay: React.FC<WhatPeopleSayProps> = ({
  courseId,
  courseName,
  onRateClick,
  onSeeAllReviews,
}) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const { data: sampleRows, isLoading, isError } = useCourseReviewSample(courseId, user?.id);
  const community = useMemo(() => reviewsCommunitySample(sampleRows ?? [], user?.id), [sampleRows, user?.id]);

  const heading = t('courseDetail.sections.whatPeopleSay');
  const total = community.totalRatingCount;
  const count = community.ratingCount;
  const score = community.score;
  const yours = community.viewerScore;

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
      {yours != null ? t('courseDetail.place.editRating') : t('courseDetail.communityScore.rateThis')}
    </button>
  );

  const seeAll = onSeeAllReviews ? (
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
  ) : null;

  // The sample is in flight: 0 would state something untrue.
  if (isLoading) return null;

  // CRM2.2 — an error is not an absence: a failed fetch renders nothing, so
  // the "No one's scored yet" invitation below can only mean a genuinely
  // empty, successfully fetched sample.
  if (isError) return null;

  // NOBODY HAS SCORED IT — a sentence and an invitation, not a card. (CRM1.8: untouched.)
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

  /* CRM1.7b — THE ONLY RATING IS THE VIEWER'S. The community count is zero and
     there is no community score, so nothing community-flavoured prints: no
     figure, no tier word, no bands, no YOU pill. */
  if (total === 1 && yours != null) {
    return (
      <AboutSection kicker={t('courseDetail.reviewsHead.kicker')} title={t('courseDetail.reviewsHead.youFirst')}>
        <p style={{ margin: '14px 0 0', fontSize: 12.5, lineHeight: 1.55, color: SURFACE.dark.body, fontFamily: SANS }}>
          {t('courseDetail.reviewsHead.youFirstBody', { score: yours.toFixed(1) })}
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 13, marginTop: 15 }}>
          <strong style={{ color: A.INK, fontSize: 48, lineHeight: 0.9, fontWeight: 800, ...FIGS }}>{yours.toFixed(1)}</strong>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: SURFACE.dark.ink, fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Yours</div>
            <div style={{ color: SURFACE.dark.dim, fontSize: 11.5, lineHeight: 1.45, marginTop: 2, ...FIGS }}>1 rating</div>
          </div>
        </div>
        {rateAction}
        {seeAll}
      </AboutSection>
    );
  }

  /* CRM1.2 — the unchanged headline key, now fed the viewer-excluding pair:
     nine ratings of which one is the viewer's reads "9.3 from eight golfers". */
  const title = t('courseDetail.reviewsHead.title', {
    count,
    score: (score ?? 0).toFixed(1),
    golfers: shotsInWords(count),
  });

  const facts = fewReviewFacts(community);
  const ratedViewer = yours != null;

  return (
    <AboutSection kicker={t('courseDetail.reviewsHead.kicker')} title={title}>
      {/* CRM1.3/1.4 — the Reviews tab's figure row: ink score, tier over count, YOU pill at the end. */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 15 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 13, minWidth: 0 }}>
          <strong data-community-score style={{ color: SURFACE.dark.ink, fontSize: 48, lineHeight: 0.9, fontWeight: 800, ...FIGS }}>{score?.toFixed(1)}</strong>
          <div style={{ minWidth: 0 }}>
            {/* CRM2.1 — the tier word needs two community ratings; below that its slot collapses. */}
            {hasCommunityAverage(count) && <div style={{ color: SURFACE.dark.ink, fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{getRatingTierLabel(score)}</div>}
            <div data-community-rater-count={count} style={{ color: SURFACE.dark.dim, fontSize: 11.5, lineHeight: 1.45, marginTop: 2, overflowWrap: 'anywhere', ...FIGS }}>{count} {count === 1 ? 'rating' : 'ratings'}</div>
          </div>
        </div>
        {ratedViewer && community.delta != null && <div data-viewer-delta style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '5px 10px', whiteSpace: 'nowrap', flex: '0 0 auto', borderRadius: 999, border: `1px solid ${inkWithAlpha(A.AMBER, 0.35)}`, background: inkWithAlpha(A.AMBER, 0.07) }}><span style={{ color: SURFACE.dark.mute, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>You</span><b style={{ color: A.INK, fontSize: 14, ...FIGS }}>{yours?.toFixed(1)}</b><span style={{ color: A.INK, fontSize: 10, fontWeight: 800, ...FIGS }}>{community.delta > 0 ? '▲' : community.delta < 0 ? '▼' : ''} {Math.abs(community.delta).toFixed(1)}</span></div>}
      </div>

      {/* CRM1.6 — the shared 2×2 category bars, no kicker, heading or prose; two community ratings and up. */}
      {facts && facts.bands.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <CategoryBarGrid items={facts.bands.map(b => ({ key: b.key, label: b.label, value: b.mean }))} />
        </div>
      )}

      {rateAction}

      {seeAll}
    </AboutSection>
  );
};

export default WhatPeopleSay;

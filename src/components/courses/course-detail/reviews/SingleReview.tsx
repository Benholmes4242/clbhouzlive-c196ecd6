/** REVIEWS_STATE_2 signed-off person-led exception to the flat multi-review row.
 * A review owns its overall score; calibration refers to that same source.
 * REVIEWS_FIRST_RATING_1: shows the Course tab aggregate with its count beside it
 * (courseRatingFloor display rule); still no bars, distribution or categories.
 * playedMonth is a review-owned input only: current stored reviews omit it.
 * This component owns its gutter; the existing tab owns the top seam.
 * Rater-context reads are isolated to person rows, never used as community data.
 * Reviews state-local rater context stays isolated from communitySample; module headers own each state contract to prevent context from becoming aggregate data. */
import React from 'react';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MentionText } from '@/components/mentions/MentionText';
import { ReviewMediaStrip } from '@/components/courses/review/ReviewMediaStrip';
import type { CourseReview } from '@/hooks/useCourseReviews';
import { useSingleReviewContext } from '@/hooks/useSingleReviewContext';
import { calibrationFacts, isSingleReview, reviewPlayedMonth, type RaterContext } from '@/lib/reviews/singleReview';
import { SURFACE } from '@/lib/tokens/surface';
import { MEMBER_PANEL, INK_ON_LIGHT, inkWithAlpha } from '@/lib/tokens/surfaces';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { SC_BOGEY_DARK } from '@/features/courses/components/holes/_constants';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { GUTTER, VERDICT_KICKER, TAB_TITLE } from '../about/AboutSection';
import { CategoryLine } from './reviewFlatBits';

interface SingleReviewProps {
  totalRatings: number;
  review?: CourseReview;
  /** Only the review's own known played month; no derived date is accepted. */
  playedMonth?: number | null;
  context?: RaterContext | null;
  onMediaClick: (index: number, el: HTMLElement | null) => void;
  onAddYours: () => void;
  /** RF3R: Course tab aggregate (course_rating_aggregates); shown with its count beside it. */
  communityScore?: number | null;
  communityCount?: number | null;
  /** RF5: the single rating is the viewer's own. */
  isViewerOwn?: boolean;
  courseName?: string;
}

export function SingleReview({ totalRatings, review, playedMonth, context, onMediaClick, onAddYours, communityScore = null, communityCount = null, isViewerOwn = false, courseName = '' }: SingleReviewProps) {
  const { data: fetchedContext } = useSingleReviewContext(context === undefined ? review?.user_id : undefined, review?.course_id ?? '');
  if (!isSingleReview(totalRatings)) return null;
  const facts = context === undefined ? fetchedContext : context;
  const calibration = review ? calibrationFacts(review, facts) : null;
  const gender = facts?.gender?.toLowerCase();
  const subject = gender === 'male' ? 'He' : gender === 'female' ? 'She' : 'They';
  const verb = subject === 'They' ? 'have' : 'has';
  const person = subject === 'He' ? 'a man' : subject === 'She' ? 'a woman' : 'someone';
  // RF6: first word of the same resolved name the rater row shows; pronoun from the calibration source.
  const object = subject === 'He' ? 'him' : subject === 'She' ? 'her' : 'them';
  const resolvedName = review?.user_profiles?.display_name || review?.user_profiles?.username || null;
  const firstName = resolvedName?.trim().split(/\s+/)[0] || null;
  const lede = isViewerOwn
    ? 'You got here first. Every golfer who rates it from now moves the number with you.'
    : firstName
      ? `${firstName} got here first. Every golfer who rates it from now moves the number with ${object}.`
      : `A golfer got here first. Every golfer who rates it from now moves the number with ${object}.`;
  return <section data-reviews-state="one" aria-labelledby="reviews-one-title" style={{ padding: `0 ${GUTTER}px 20px`, fontFamily: SANS }}>
    <div style={VERDICT_KICKER}>The first rating</div>
    <h2 id="reviews-one-title" style={TAB_TITLE}>{courseName} is on the board</h2>
    {communityScore != null && communityCount != null && <div style={{ display: 'flex', alignItems: 'flex-end', gap: 11, marginTop: 15 }}>
      <div data-community-score style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 0.9, color: A.INK, ...FIGS }}>{Number(communityScore).toFixed(1)}</div>
      <div style={{ paddingBottom: 5 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: A.INK, lineHeight: 1.2 }}>The community score</div>
        <div style={{ fontSize: 11.5, color: A.DIM, lineHeight: 1.45, marginTop: 2, ...FIGS }}>{communityCount} {communityCount === 1 ? 'rating' : 'ratings'}</div>
      </div>
    </div>}
    <p style={{ color: SURFACE.dark.mute, fontSize: 12.5, lineHeight: 1.5, margin: '8px 0 0' }}>{lede}</p>
    {review && <RaterReviewRow review={review} context={facts} playedMonth={playedMonth} onMediaClick={onMediaClick} />}
    {calibration && <p data-review-calibration style={{ borderLeft: `2px solid ${A.AMBER}`, paddingLeft: 11, color: SURFACE.dark.body, fontSize: 13, lineHeight: 1.5, margin: '14px 0 0' }}>
      {calibration.everyCategory && <>{subject} gave it <b style={{ color: SURFACE.dark.ink, ...FIGS }}>{review?.rating?.toFixed(1)}</b> on every category. </>}
      <b style={{ color: SURFACE.dark.ink, fontWeight: 700, ...FIGS }}>{subject} {verb} rated {calibration.coursesRated} courses and given {calibration.perfectTens} of them a ten</b> — so this is not {person} who hands them out.
    </p>}
    <p data-first-rating-close style={{ borderLeft: `2px solid ${A.AMBER}`, paddingLeft: 11, color: SURFACE.dark.mute, fontSize: 13, lineHeight: 1.5, margin: '14px 0 0' }}>{isViewerOwn
      ? <>The next golfer to rate it makes <b style={{ color: A.INK, fontWeight: 700 }}>the score an average of two</b>.</>
      : <>Add yours and <b style={{ color: A.INK, fontWeight: 700 }}>the score becomes an average of two</b>.</>}</p>
    <Button variant="ghost" onClick={onAddYours} style={{ background: SURFACE.dark.ink, color: INK_ON_LIGHT, borderRadius: 999, marginTop: 15, height: 'auto', minHeight: 42, padding: '11px 22px', fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>{isViewerOwn ? 'Edit yours' : 'Add yours'}</Button>
  </section>;
}
/** Existing State 2 person row shared with State 3; context never feeds aggregates. */
export function RaterReviewRow({ review, context, playedMonth, onMediaClick, flat = false }: {
  review: CourseReview; context?: RaterContext | null; playedMonth?: number | null;
  onMediaClick: (index: number, el: HTMLElement | null) => void; flat?: boolean;
}) {
  const { data: fetchedContext } = useSingleReviewContext(context === undefined ? review.user_id : undefined, review.course_id);
  const facts = context === undefined ? fetchedContext : context;
  const month = reviewPlayedMonth(playedMonth);
  const name = review.user_profiles?.display_name || review.user_profiles?.username || 'Anonymous';
  const contextItems: React.ReactNode[] = [];
  if (facts?.handicap != null) contextItems.push(`${facts.handicap} handicap`);
  if (facts?.roundsHere != null && facts.roundsHere > 0) contextItems.push(<em key="played" data-tracked-play style={{ color: A.IMPROVED, fontStyle: 'normal', fontWeight: 700 }}>Played here {facts.roundsHere === 1 ? 'once' : facts.roundsHere === 2 ? 'twice' : `${facts.roundsHere} times`}</em>);
  if (facts?.coursesRated != null) contextItems.push(`${facts.coursesRated} courses rated`);
  return (
    <article data-testid="review-row" data-review-id={review.id} style={flat ? { padding: '14px 0', borderBottom: `1px solid ${inkWithAlpha(SURFACE.dark.ink, 0.06)}` } : { marginTop: 15, background: MEMBER_PANEL, border: `1px solid ${inkWithAlpha(SURFACE.dark.ink, 0.07)}`, borderRadius: 13, padding: 15 }}>
      <div data-rater-row style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <SquircleAvatar src={review.user_profiles?.profile_photo_url} alt={name} userId={review.user_id} size={34} hairlineRing />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: SURFACE.dark.ink, fontSize: 14, fontWeight: 700, overflowWrap: 'anywhere', lineHeight: 1.2 }}>{name}</div>
          {contextItems.length > 0 && <div data-rater-context style={{ color: SURFACE.dark.dim, fontSize: 11, lineHeight: 1.45, marginTop: 3, ...FIGS }}>
            {contextItems.map((item, index) => <React.Fragment key={index}>{index > 0 && ' · '}{item}</React.Fragment>)}
          </div>}
        </div>
        <strong data-review-score style={{ flexShrink: 0, color: flat ? SURFACE.dark.ink : MEDAL_GOLD, fontSize: 19, fontWeight: 800, lineHeight: 1.2, ...FIGS }}>{review.rating?.toFixed(1)}</strong>
      </div>
      <CategoryLine review={review} />
      {review.review?.trim() && <MentionText as="p" text={review.review} style={{ color: SURFACE.dark.body, fontSize: 13, lineHeight: 1.5, margin: '10px 0 0', overflowWrap: 'anywhere' }} />}
      {month && <span data-played-season style={{ display: 'inline-block', marginTop: 9, padding: '3px 9px', borderRadius: 999, color: SC_BOGEY_DARK, background: inkWithAlpha(SC_BOGEY_DARK, 0.10), border: `1px solid ${inkWithAlpha(SC_BOGEY_DARK, 0.22)}`, fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase' }}>Played {month}</span>}
      {!!review.media?.length && <div style={{ marginTop: 11 }}><ReviewMediaStrip media={review.media} onMediaClick={onMediaClick} tileMode="equal" tileHeight={72} tileRadius={9} tileGap={4} maxItems={4} /></div>}
    </article>
  );
}

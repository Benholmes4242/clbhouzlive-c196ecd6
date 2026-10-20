/** REVIEWS_STATE_3/4: total selects this shared screen; complete excluding community
 * owns every aggregate figure. The existing course circle means
 * outgoing follows; it marks only already-visible, blocked-filtered prose rows.
 * State 2's row/context and panel are reused, never a second review row.
 * All sections are unframed and page-scrolled; missing identities stay unnamed.
 * State 4 adds the existing distribution at the shared excluding threshold.
 * REVIEWS_HEADER_1 owns the shared figure row and fixed category heading.
 * Tier/count share one stack wherever this screen already shows an average;
 * the below-five tier prohibition was deliberately reversed by RH11.
 * Reviews States 3/4 share FewReviews and RatingTierDistribution to prevent population drift. */
import React from 'react';
import type { CourseReview } from '@/hooks/useCourseReviews';
import { useMembersWhoPlayedCourse } from '@/hooks/useMembersWhoPlayedCourse';
import { hasCommunityAverage, hasRatingDistribution, isFewReviews, isFiveToNineReviews } from '@/lib/reviews/sampleRules';
import { RatingTierDistribution } from '@/components/courses/review/RatingTierDistribution';
import { getRatingTier, getRatingTierLabel } from '@/lib/ratingTier';
import { capitalizedRatings, fewReviewFacts, partitionKnownReviews, type ReviewsCommunity } from '@/lib/reviews/fewReviews';
import { SURFACE } from '@/lib/tokens/surface';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { Button } from '@/components/ui/button';
import { GUTTER, VERDICT_KICKER, TAB_TITLE } from '../about/AboutSection';
import { CategoryBands } from '../CategoryBands';
import { RaterReviewRow } from './SingleReview';

interface FewReviewsProps {
  community: ReviewsCommunity;
  reviews: CourseReview[];
  viewerId?: string;
  courseId: string;
  courseName: string;
  highlightedReviewId?: string | null;
  onMediaClick: (review: CourseReview, index: number, el: HTMLElement | null) => void;
  ownReview: React.ReactNode;
  afterReview?: (review: CourseReview) => React.ReactNode;
  onWrite: () => void;
}
const section: React.CSSProperties = { padding: `20px ${GUTTER}px`, borderBottom: `1px solid ${inkWithAlpha(SURFACE.dark.ink, 0.06)}` };
const kicker = VERDICT_KICKER;
const heading = TAB_TITLE;
const prose: React.CSSProperties = { color: SURFACE.dark.body, fontSize: 12.5, lineHeight: 1.55, margin: '14px 0 0' };

export function FewReviews({ community, reviews, viewerId, courseId, courseName, highlightedReviewId, onMediaClick, ownReview, afterReview, onWrite }: FewReviewsProps) {
  const { data: members } = useMembersWhoPlayedCourse(viewerId ? courseId : undefined, viewerId);
  const stateFour = isFiveToNineReviews(community.totalRatingCount);
  if (!isFewReviews(community.totalRatingCount) && !stateFour) return null;
  const showDistribution = stateFour && hasRatingDistribution(community.ratingCount);
  const ids = new Set(community.communityRows.map(row => row.id));
  const visible = reviews.filter(review => ids.has(review.id));
  const { known, others } = partitionKnownReviews(visible, new Set(members?.members.filter(member => member.in_circle).map(member => member.user_id) ?? []));
  const facts = fewReviewFacts(community);
  const ratedViewer = community.viewerScore != null;
  const renderPerson = (review: CourseReview, flat: boolean) => <React.Fragment key={review.id}><RaterReviewRow review={review} flat={flat} isHighlighted={review.id === highlightedReviewId} onMediaClick={(index, el) => onMediaClick(review, index, el)} />{afterReview?.(review)}</React.Fragment>;
  const identities = community.communityRows.map(row => {
    const profile = visible.find(review => review.id === row.id)?.user_profiles;
    const fullName = profile?.display_name?.trim() || profile?.username?.trim();
    return { name: fullName?.split(/\s+/)[0], rating: row.rating };
  });
  return <div data-reviews-state={stateFour ? 'five-to-nine' : 'few'} data-community-count={facts?.count} data-community-spread={facts?.spread}>
    <section style={{ ...section, paddingTop: 0 }}>
      <div style={kicker}>{capitalizedRatings(community.totalRatingCount)} golfers have rated it</div>
      {facts ? <>
        <h2 data-community-headline style={heading}>{courseName} sits at {community.score?.toFixed(1)}</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 15 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 13, minWidth: 0 }}>
          <strong data-community-score style={{ color: SURFACE.dark.ink, fontSize: 48, lineHeight: 0.9, fontWeight: 800, ...FIGS }}>{community.score?.toFixed(1)}</strong>
          <div style={{ minWidth: 0 }}>
              <div style={{ color: SURFACE.dark.ink, fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{getRatingTierLabel(community.score)}</div>
              <div data-community-rater-count={facts.count} style={{ color: SURFACE.dark.dim, fontSize: 11.5, lineHeight: 1.45, marginTop: 2, overflowWrap: 'anywhere', ...FIGS }}>{facts.count} {facts.count === 1 ? 'rating' : 'ratings'}</div>
          </div>
          </div>
          {ratedViewer && community.delta != null && <div data-viewer-delta style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '5px 10px', whiteSpace: 'nowrap', flex: '0 0 auto', borderRadius: 999, border: `1px solid ${inkWithAlpha(A.AMBER, 0.35)}`, background: inkWithAlpha(A.AMBER, 0.07) }}><span style={{ color: SURFACE.dark.mute, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>You</span><b style={{ color: A.AMBER, fontSize: 14, ...FIGS }}>{community.viewerScore?.toFixed(1)}</b><span style={{ color: A.IMPROVED, fontSize: 10, fontWeight: 800, ...FIGS }}>{community.delta > 0 ? '▲' : community.delta < 0 ? '▼' : ''} {Math.abs(community.delta).toFixed(1)}</span></div>}
        </div>
        {!stateFour && <div style={{ color: SURFACE.dark.dim, fontSize: 11.5, lineHeight: 1.45, marginTop: 11, overflowWrap: 'anywhere', ...FIGS }}>
          {identities.every(person => person.name) && <>{new Intl.ListFormat('en-GB').format(identities.map(person => person.name ?? ''))} · </>}
          <span data-individual-scores>{new Intl.ListFormat('en-GB').format(identities.map(person => person.rating?.toFixed(1) ?? ''))}</span>
        </div>}
        {showDistribution ? <div style={{ marginTop: 15 }}>
          <RatingTierDistribution distribution={community.distribution} activeTier={getRatingTier(community.score)} appearance="sample" />
        </div> : null}
      </> : <>
        <h2 style={heading}>The score builds from here</h2>
        <p style={prose}>Here they are — the golfers, and what they said.</p>
        {visible.map(review => renderPerson(review, false))}
      </>}
    </section>
    {hasCommunityAverage(community.ratingCount) && facts && facts.bands.length > 0 && <section style={section}>
      <div style={kicker}>What they scored</div>
      <h2 style={heading}>Where the score comes from</h2>
      <p style={{ ...prose, color: SURFACE.dark.mute, marginTop: 8 }}>The bar is the range between the lowest and highest score; the mark is the average.</p>
      <CategoryBands bands={facts.bands} />
    </section>}
    {facts && known.length > 0 && <section style={section}><span style={{ display: 'inline-block', color: MEDAL_GOLD, background: inkWithAlpha(MEDAL_GOLD, 0.10), border: `1px solid ${inkWithAlpha(MEDAL_GOLD, 0.28)}`, borderRadius: 999, padding: '3px 9px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', marginBottom: 11 }}>People you know</span>{known.map(review => renderPerson(review, true))}</section>}
    {facts && others.length > 0 && <section style={section}><div style={kicker}>Everyone else</div>{others.map(review => renderPerson(review, true))}</section>}
    {ownReview}
    {!ratedViewer && <section style={section}><Button variant="ghost" onClick={onWrite}>Add yours</Button></section>}
  </div>;
}
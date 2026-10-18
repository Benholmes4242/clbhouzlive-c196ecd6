/** REVIEWS_STATE_3: total selects this screen; complete excluding community
 * owns every aggregate and caution figure. The existing course circle means
 * outgoing follows; it marks only already-visible, blocked-filtered prose rows.
 * State 2's row/context and panel are reused, never a second review row.
 * All sections are unframed and page-scrolled; missing identities stay unnamed. */
import React from 'react';
import type { CourseReview } from '@/hooks/useCourseReviews';
import { useMembersWhoPlayedCourse } from '@/hooks/useMembersWhoPlayedCourse';
import { hasCommunityAverage, isFewReviews } from '@/lib/reviews/sampleRules';
import { capitalizedRatings, fewReviewFacts, partitionKnownReviews, spelledRatings, type ReviewsCommunity } from '@/lib/reviews/fewReviews';
import { SURFACE } from '@/lib/tokens/surface';
import { inkWithAlpha } from '@/lib/tokens/surfaces';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { Button } from '@/components/ui/button';
import { GUTTER } from '../about/AboutSection';
import { RaterReviewRow } from './SingleReview';

interface FewReviewsProps {
  community: ReviewsCommunity;
  reviews: CourseReview[];
  viewerId?: string;
  courseId: string;
  onMediaClick: (review: CourseReview, index: number, el: HTMLElement | null) => void;
  ownReview: React.ReactNode;
  afterReview?: (review: CourseReview) => React.ReactNode;
  onWrite: () => void;
}
const section: React.CSSProperties = { padding: `20px ${GUTTER}px`, borderBottom: `1px solid ${inkWithAlpha(SURFACE.dark.ink, 0.06)}` };
const kicker: React.CSSProperties = { color: A.AMBER, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.2, marginBottom: 5 };
const heading: React.CSSProperties = { color: SURFACE.dark.ink, fontSize: 19, fontWeight: 700, lineHeight: 1.2, margin: 0 };
const prose: React.CSSProperties = { color: SURFACE.dark.body, fontSize: 12.5, lineHeight: 1.55, margin: '14px 0 0' };

export function FewReviews({ community, reviews, viewerId, courseId, onMediaClick, ownReview, afterReview, onWrite }: FewReviewsProps) {
  const { data: members } = useMembersWhoPlayedCourse(viewerId ? courseId : undefined, viewerId);
  if (!isFewReviews(community.totalRatingCount)) return null;
  const ids = new Set(community.communityRows.map(row => row.id));
  const visible = reviews.filter(review => ids.has(review.id));
  const { known, others } = partitionKnownReviews(visible, new Set(members?.members.filter(member => member.in_circle).map(member => member.user_id) ?? []));
  const facts = fewReviewFacts(community);
  const ratedViewer = community.viewerScore != null;
  const renderPerson = (review: CourseReview, flat: boolean) => <React.Fragment key={review.id}><RaterReviewRow review={review} flat={flat} onMediaClick={(index, el) => onMediaClick(review, index, el)} />{afterReview?.(review)}</React.Fragment>;
  const identities = community.communityRows.map(row => {
    const profile = visible.find(review => review.id === row.id)?.user_profiles;
    const fullName = profile?.display_name?.trim() || profile?.username?.trim();
    return { name: fullName?.split(/\s+/)[0], rating: row.rating };
  });
  return <div data-reviews-state="few">
    <section style={{ ...section, paddingTop: 0 }}>
      <div style={kicker}>{capitalizedRatings(community.totalRatingCount)} golfers have rated it</div>
      {facts ? <>
        <h2 data-community-headline style={heading}>{community.score?.toFixed(1)} {ratedViewer ? `from the other ${spelledRatings(facts.count)}` : `from ${spelledRatings(facts.count)} golfers`}</h2>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 13, marginTop: 15 }}>
          <strong data-community-score style={{ color: SURFACE.dark.ink, fontSize: 48, lineHeight: 0.9, fontWeight: 800, ...FIGS }}>{community.score?.toFixed(1)}</strong>
          <div style={{ minWidth: 0 }}>
            {identities.every(person => person.name) && <div style={{ color: SURFACE.dark.ink, fontSize: 13, fontWeight: 700, overflowWrap: 'anywhere' }}>{new Intl.ListFormat('en-GB').format(identities.map(person => person.name ?? ''))}</div>}
            <div data-individual-scores style={{ color: SURFACE.dark.dim, fontSize: 11.5, lineHeight: 1.45, marginTop: 2, ...FIGS }}>{new Intl.ListFormat('en-GB').format(identities.map(person => person.rating?.toFixed(1) ?? ''))}</div>
          </div>
        </div>
        {ratedViewer && community.delta != null && <div data-viewer-delta style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 7, marginTop: 13, padding: '7px 12px', borderRadius: 999, border: `1px solid ${inkWithAlpha(A.AMBER, 0.35)}`, background: inkWithAlpha(A.AMBER, 0.07) }}><span style={{ color: SURFACE.dark.mute, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>You</span><b style={{ color: A.AMBER, fontSize: 15, ...FIGS }}>{community.viewerScore?.toFixed(1)}</b><span style={{ color: A.IMPROVED, fontSize: 11, fontWeight: 800, ...FIGS }}>{community.delta > 0 ? '▲' : community.delta < 0 ? '▼' : ''} {Math.abs(community.delta).toFixed(1)} {community.delta > 0 ? 'above' : community.delta < 0 ? 'below' : 'the same'}</span></div>}
        <p data-community-caution data-community-count={facts.count} data-community-spread={facts.spread} style={prose}>{facts.caution}</p>
      </> : <>
        <h2 style={heading}>There is no community score yet</h2>
        <p style={prose}>One opinion is not an average. Here it is as what it is — a person, and what they said.</p>
        {visible.map(review => renderPerson(review, false))}
      </>}
    </section>
    {hasCommunityAverage(community.ratingCount) && facts && facts.bands.length > 0 && <section style={section}>
      <div style={kicker}>What they scored</div>
      {facts.highest && <h2 style={heading}>{facts.highest.key === 'facilities' ? 'The facilities carry it' : `The ${facts.highest.label.toLowerCase()} carries it`}</h2>}
      <p style={{ ...prose, color: SURFACE.dark.mute, marginTop: 8 }}>The bar is the range between the lowest and highest score; the mark is the average.{ratedViewer ? ' You are not counted in either.' : ''}</p>
      <div style={{ marginTop: 16 }}>
        {facts.bands.map(band => <div key={band.key} data-category-band={band.key} data-low={band.low} data-high={band.high} data-mean={band.mean} style={{ display: 'grid', gridTemplateColumns: '82px minmax(0, 1fr) 72px', alignItems: 'center', gap: 10, padding: '8px 0' }}>
          <span style={{ color: SURFACE.dark.body, fontSize: 11.5, fontWeight: 700, lineHeight: 1.45 }}>{band.label}</span>
          <div style={{ height: 9, borderRadius: 5, background: inkWithAlpha(SURFACE.dark.ink, 0.05), position: 'relative' }}>
            <div data-range style={{ position: 'absolute', top: 0, bottom: 0, left: `${band.low * 10}%`, width: `${(band.high - band.low) * 10}%`, background: inkWithAlpha(SURFACE.dark.ink, 0.22), borderRadius: 5 }} />
            <div data-mean-mark style={{ position: 'absolute', top: -2, bottom: -2, width: 3, borderRadius: 2, left: `calc(${band.mean * 10}% - 1.5px)`, background: SURFACE.dark.ink }} />
          </div>
          <span style={{ color: SURFACE.dark.ink, fontSize: 13, fontWeight: 800, textAlign: 'right', ...FIGS }}>{band.mean.toFixed(1)}<span style={{ display: 'block', color: SURFACE.dark.dim, fontSize: 9.5, marginTop: 1 }}>{band.low.toFixed(1)}–{band.high.toFixed(1)}</span></span>
        </div>)}
      </div>
      {facts.finding && <p style={{ ...prose, borderLeft: `2px solid ${A.AMBER}`, paddingLeft: 11 }}>They agree on <b style={{ color: SURFACE.dark.ink }}>{facts.finding.tightest.label.toLowerCase()}</b> and split on the <b style={{ color: SURFACE.dark.ink }}>{facts.finding.widest.label.toLowerCase()}</b>, where the gap is <b style={{ color: SURFACE.dark.ink, ...FIGS }}>{facts.finding.widest.gap.toFixed(1)}</b>. A mean alone would have hidden that.</p>}
    </section>}
    {facts && known.length > 0 && <section style={section}><span style={{ display: 'inline-block', color: MEDAL_GOLD, background: inkWithAlpha(MEDAL_GOLD, 0.10), border: `1px solid ${inkWithAlpha(MEDAL_GOLD, 0.28)}`, borderRadius: 999, padding: '3px 9px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', marginBottom: 11 }}>People you know</span>{known.map(review => renderPerson(review, true))}</section>}
    {facts && others.length > 0 && <section style={section}><div style={kicker}>Everyone else</div>{others.map(review => renderPerson(review, true))}</section>}
    {ownReview}
    {!ratedViewer && <section style={section}><Button variant="ghost" onClick={onWrite}>Add yours</Button></section>}
  </div>;
}
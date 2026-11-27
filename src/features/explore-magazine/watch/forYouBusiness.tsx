/** Brief 46 — Clubs and brands parts: the business card (the coach card with a radius-12 logo,
 * name + business tick and "category · place"), its rail and loading shell. Kept apart from
 * forYouParts so business ticks never sit in a file that renders member names. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { PosterFallback } from './videoUnit';
import { Box, FollowPill, ForYouHeading, FyRail } from './forYouParts';
import { businessLine, videoCountLabel, type BusinessWithVideos } from './forYouRules';

export const BusinessTick = () => <VerifiedBadge size="sm" className="watch-fy-biz-tick" />;

export function BusinessCard({ item }: { item: BusinessWithVideos }) {
  const navigate = useNavigate();
  const { business, videos } = item;
  const [failed, setFailed] = useState(false);
  const openProfile = () => navigate(`/business/${business.business_id}`);
  const line = businessLine(business);
  return <div className="watch-fy-coach" data-business-card={business.business_id} role="link" tabIndex={0} onClick={openProfile} onKeyDown={e => { if (e.key === 'Enter') openProfile(); }}>
    <div className="watch-fy-coach-row">
      <span className="watch-fy-coach-avatar watch-fy-biz-logo">{business.logo_url && !failed ? <img src={business.logo_url} alt="" onError={() => setFailed(true)} /> : <PosterFallback initial={getInitialsFromName(business.name) || '?'} size={16} />}</span>
      <div className="watch-fy-coach-text">
        <div className="watch-fy-biz-name"><span className="watch-fy-coach-name">{business.name}</span><VerifiedBadge size="sm" /></div>
        {line ? <div className="watch-fy-coach-line" data-business-line>{line}</div> : null}
      </div>
    </div>
    <div className="watch-fy-coach-foot">
      <div><b data-business-count>{videoCountLabel(videos.length)}</b><i>Videos</i></div>
      <FollowPill userId={business.business_id} actorType="business" />
    </div>
  </div>;
}

export function BusinessCards({ businesses }: { businesses: BusinessWithVideos[] }) {
  return <>
    <div className="watch-fy-sublabel">The clubs and brands</div>
    <FyRail label="businesses">{businesses.map(b => <BusinessCard key={b.business.business_id} item={b} />)}</FyRail>
  </>;
}

export function BusinessesSkeleton() {
  return <div aria-hidden data-businesses-skeleton>
    <ForYouHeading eyebrow="Clubs and brands" title="From clubs and brands" />
    <div className="watch-fy-rail" style={{ overflow: 'hidden' }}><Box w={156} h={248} r={12} /><Box w={156} h={248} r={12} /></div>
    <div className="watch-fy-sublabel">The clubs and brands</div>
    <div className="watch-fy-rail" style={{ overflow: 'hidden' }}><Box w={236} h={136} r={18} /><Box w={236} h={136} r={18} /></div>
  </div>;
}


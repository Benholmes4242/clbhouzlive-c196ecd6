/** Brief 42 A — Featured this week as the Top 10 rail family. Same read as the retired flip deck
 * (get_watch_featured, server order), first five shown; same guest/thin/error fallback to WatchLead.
 * Only the snapped card mounts the muted autoplay layer; the others show their poster. Tapping opens
 * the viewer exactly as the deck did (whole shown list, this index, amateur-watch). */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TenMediaCard } from '@/components/topTen/TenMediaCard';
import { RAIL_GAP, useRailCardSize } from '@/components/topTen/TenRail';
import { Button } from '@/components/ui/button';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';
import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import { useProMembers } from '@/features/pro-verification/useProMembers';
import { formatDuration } from '@/features/watch-v2/utils/formatDuration';
import { toFeedPosts } from '@/features/watch-v2/utils/toFeedPost';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { stripMentionMarkup } from '@/lib/mentions/format';
import { getThumbnailUrl } from '@/utils/thumbnail';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { AutoplayLayer, hlsFor } from './videoUnit';
import { WatchLead } from './WatchLead';
import { ForYouHeading } from './forYouParts';
import { toHubRow, type WatchVideoRow } from './watchMiddle';
import { FEATURED_MIN } from './featuredRules';
import { FEATURED_SHOWN, featuredReason } from './forYouRules';
import type { WatchFeaturedRow } from './useWatchFeatured';
import '@/styles/clbhouz-ten.css';
import '@/styles/top-ten.css';
import './watch-for-you.css';

const posterOf = (row: WatchFeaturedRow) => row.poster_url ?? (row.stream_id ? getThumbnailUrl({ streamId: row.stream_id, height: 720 }) : null);
const titleOf = (row: WatchFeaturedRow) => (row.caption ? stripMentionMarkup(String(row.caption)).trim() : '') || row.course_name || '';

/** Loading geometry: two chart-sized cards and five ticks, no text. */
export function FeaturedRailSkeleton() {
  const container = useRef<HTMLDivElement>(null);
  const size = useRailCardSize(container);
  return <div ref={container} className="clb-ten watch-fy-ten" style={{ '--ten-card-w': `${size.width}px`, '--ten-card-h': `${size.height}px` } as React.CSSProperties} data-watch-featured-skeleton aria-hidden>
    <ForYouHeading eyebrow="Featured this week" title="The week's best" />
    <div className="clb-ten-rail watch-fy-ten-rail" style={{ overflow: 'hidden' }}>{[0, 1].map(i => <div key={i} className="clb-ten-shell-card clb-shimmer-dark" />)}</div>
    <div className="clb-ten-ticks">{Array.from({ length: 5 }, (_, i) => <span key={i} className="ten-rail-skeleton-tick" />)}</div>
  </div>;
}

export function WatchFeaturedRail({ rows, onDepart }: { rows: WatchFeaturedRow[]; onDepart: () => void }) {
  const shown = useMemo(() => rows.slice(0, FEATURED_SHOWN), [rows]);
  const container = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const size = useRailCardSize(container);
  const [active, setActive] = useState(0);
  const pros = useProMembers(shown.map(r => (r.actor_type === 'personal' ? r.actor_id : null)));
  const posts = useMemo(() => toFeedPosts(shown.map(row => ({ ...toHubRow(row as unknown as WatchVideoRow), comment_count: row.comment_count }))), [shown]);
  const hubRows = useMemo(() => shown.map(row => toHubRow(row as unknown as WatchVideoRow)), [shown]);
  const scrollTo = (index: number) => rail.current?.scrollTo?.({ left: index * (size.width + RAIL_GAP), behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const open = (index: number) => {
    const row = shown[index];
    analyticsEvents.track('amateur_watch_tapped', { kind: 'featured', filter: 'all' });
    onDepart();
    openWithOrigin({ posts, index, originEl: null, posterUrl: row ? posterOf(row) : null, openedFrom: 'amateur-watch', forceStartAtZero: true });
  };
  return <section ref={container} className="clb-ten watch-fy-ten" data-watch-featured-rail style={{ '--ten-card-w': `${size.width}px`, '--ten-card-h': `${size.height}px` } as React.CSSProperties}>
    <ForYouHeading eyebrow="Featured this week" title="The week's best" />
    <div ref={rail} className="clb-ten-rail watch-fy-ten-rail" data-watch-rail="featured"
      onScroll={e => setActive(Math.max(0, Math.min(shown.length - 1, Math.round(e.currentTarget.scrollLeft / (size.width + RAIL_GAP)))))}>
      {shown.map((row, index) => {
        const poster = posterOf(row);
        const personal = row.actor_type === 'personal';
        return <TenMediaCard key={row.post_id} dataId={row.post_id} rank={index + 1} ariaLabel={`#${index + 1} ${titleOf(row) || row.display_name}`} onClick={() => open(index)}
          media={<>{poster ? <img className="watch-fy-ten-poster" src={poster} alt="" decoding="async" loading={index === 0 ? 'eager' : 'lazy'} /> : <span className="watch-fy-ten-poster watch-fy-ten-blank" />}
            {index === active ? <AutoplayLayer key={row.post_id} hlsUrl={hlsFor(hubRows[index])} poster={poster} /> : null}</>}
          corner={row.duration_seconds ? <span className="ten-score-pill ten-rail-score watch-fy-duration" data-featured-duration>{formatDuration(row.duration_seconds)}</span> : null}
          name={titleOf(row)}
          place={<span className="watch-fy-creator"><span className="watch-fy-creator-avatar">{row.avatar_url ? <img src={row.avatar_url} alt="" /> : <PlayerSilhouette />}</span><span className="watch-fy-creator-name"><InlineProMemberName userId={personal ? row.actor_id : undefined}>{row.display_name}</InlineProMemberName></span></span>}
          figures={[{ label: 'Likes', value: Number(row.like_count ?? 0) }, { label: 'Comments', value: Number(row.comment_count ?? 0) }]}
          story={featuredReason(row, shown, personal ? pros.members.get(row.actor_id)?.pro_kind : null)} />;
      })}
    </div>
    <div className="clb-ten-ticks">{shown.map((row, index) => <Button variant="ghost" key={row.post_id} className="clb-ten-tick" aria-label={`Go to card ${index + 1}`} aria-current={active === index} onClick={() => scrollTo(index)} />)}</div>
    {shown.length > 1 ? <div className="clb-ten-hint"><span>{`Swipe for 2 to ${shown.length}`}</span></div> : null}
  </section>;
}

/** Same slot rules as the deck: guests, a failed read or a thin set keep WatchLead. */
export function WatchFeaturedRailSlot({ userId, onDepart, featured }: { userId: string | undefined; onDepart: () => void; featured: { data?: WatchFeaturedRow[]; isFetched: boolean; isError: boolean } }) {
  const fallbackReason = featured.isError ? 'error' : featured.isFetched && (featured.data?.length ?? 0) < FEATURED_MIN ? 'too_few' : null;
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (userId && fallbackReason && reported.current !== fallbackReason) {
      reported.current = fallbackReason;
      analyticsEvents.track('watch_featured_fallback', { reason: fallbackReason });
    }
  }, [fallbackReason, userId]);
  if (!userId) return <WatchLead userId={userId} onDepart={onDepart} />;
  if (!featured.isFetched && !featured.isError) return <FeaturedRailSkeleton />;
  if (featured.isError || (featured.data?.length ?? 0) < FEATURED_MIN) return <WatchLead userId={userId} onDepart={onDepart} />;
  return <WatchFeaturedRail rows={featured.data ?? []} onDepart={onDepart} />;
}

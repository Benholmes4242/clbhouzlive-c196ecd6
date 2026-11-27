/** Brief 42 — For you shared parts: the canonical heading, the native rail, video tiles,
 * wide 16:9 cards, the Coaching section/coach cards and loading shells with loaded geometry. */
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerSilhouette } from '@/components/ui/PlayerSilhouette';
import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { InlineProMemberName } from '@/features/pro-verification/InlineProMemberName';
import type { HubRpcRow } from '@/features/watch-v2/utils/toFeedPost';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useFollowState } from '@/hooks/useFollowState';
import { getProfilePathById } from '@/lib/profileRoutes';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { postAuthor } from '@/lib/postAuthor';
import { toast } from '@/lib/toast';
import { AutoplayLayer, PosterFallback, creatorName, hlsFor, posterFor, videoTitle } from './videoUnit';
import { shortAge } from './watchMiddle';
import { videoCountLabel, type CoachWithVideos } from './forYouRules';
import { BusinessTick } from './forYouBusiness';
import './watch-for-you.css';

export const FY_BADGE = { placement: 'top-right', top: 6, right: 6 } as const;

export function ForYouHeading({ eyebrow, title, seeAll = 'See all', onSeeAll }: { eyebrow: string; title: string; seeAll?: string; onSeeAll?: () => void }) {
  return <div className="watch-fy-head" data-fy-head>
    <div className="watch-fy-eyebrow" data-fy-eyebrow>{eyebrow}</div>
    <div className="watch-fy-head-row"><h2 className="watch-fy-title" data-fy-title>{title}</h2>
      {onSeeAll ? <button type="button" className="watch-fy-see" data-fy-see-all onClick={onSeeAll}>{seeAll}</button> : null}</div>
  </div>;
}

export function FyRail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="watch-fy-rail" data-watch-rail={label}>{children}</div>;
}

function Frame({ row, width, height, autoplay }: { row: HubRpcRow; width: number | string; height: number | null; autoplay: boolean }) {
  const poster = posterFor(row, 480);
  const [failed, setFailed] = useState(false);
  return <span className="watch-fy-frame" data-watch-frame style={{ width, ...(height == null ? { aspectRatio: '126 / 224' } : { height }) }}>
    {poster && !failed ? <img src={poster} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <PosterFallback initial={getInitialsFromName(creatorName(row)) || '?'} size={20} />}
    {autoplay ? <AutoplayLayer hlsUrl={hlsFor(row)} poster={poster} /> : null}
    <span className="watch-fy-frame-badge"><GlassDurationBadge seconds={row.duration_seconds ?? null} {...FY_BADGE} /></span>
  </span>;
}

const authorId = (row: HubRpcRow) => (postAuthor(row).kind === 'personal' ? postAuthor(row).id : undefined);

/** Shorts-style tile: poster, two-line title, creator line. */
export function FyTile({ row, width, height, onOpen, kind, autoplay = true, meta, tick = false }: { row: HubRpcRow; width: number | '100%'; height: number | null; onOpen: () => void; kind: string; autoplay?: boolean; meta?: ReactNode; tick?: boolean }) {
  const who = creatorName(row);
  return <button type="button" className="watch-fy-tile" data-watch-card={kind} data-fy-post={row.post_id} onClick={onOpen} style={{ width }}>
    <Frame row={row} width="100%" height={height} autoplay={autoplay} />
    <span className="watch-fy-tile-title">{videoTitle(row, 'Untitled video')}</span>
    {who ? <span className="watch-fy-tile-who" data-watch-sub="creator"><InlineProMemberName userId={authorId(row)}>{who}</InlineProMemberName>{tick ? <BusinessTick /> : null}{meta}</span> : null}
  </button>;
}

/** 16:9 card; meta defaults to "· age". */
export function FyWide({ row, width, onOpen, kind, meta }: { row: HubRpcRow; width: number; onOpen: () => void; kind: string; meta?: string | null }) {
  const age = meta === undefined ? shortAge(row.post_created_at) : meta;
  return <FyTile row={row} width={width} height={Math.round(width * 9 / 16)} onOpen={onOpen} kind={kind} autoplay={false}
    meta={age ? <span className="watch-fy-dim"> · {age}</span> : null} />;
}

export function FollowPill({ userId, actorType = 'personal' }: { userId: string; actorType?: 'personal' | 'business' }) {
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();
  const viewerType = (activeActor?.type ?? 'personal') as 'personal' | 'business';
  const viewerId = activeActor?.id ?? user?.id;
  const { isFollowing } = useFollowState({ targetActorType: actorType, targetActorId: userId, viewerActorType: viewerType, viewerActorId: viewerId });
  const [local, setLocal] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const following = local ?? isFollowing ?? false;
  if (!user?.id || user.id === userId) return null;
  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) return;
    const prev = following;
    setLocal(!prev); setPending(true);
    try {
      await toggle.mutateAsync({ targetActorType: actorType, targetActorId: userId, targetUserId: userId, viewerActorType: viewerType, viewerActorId: viewerId!, viewerUserId: user.id, isFollowing: prev } as Parameters<typeof toggle.mutateAsync>[0]);
    } catch {
      setLocal(prev);
      toast.error(prev ? 'Could not unfollow' : 'Could not follow');
    } finally { setPending(false); }
  };
  return <button type="button" className="watch-fy-follow" data-coach-follow={following ? 'on' : 'off'} aria-pressed={following} disabled={pending} onClick={onClick}>{following ? 'Following' : 'Follow'}</button>;
}

export function CoachCard({ item }: { item: CoachWithVideos }) {
  const navigate = useNavigate();
  const { coach, videos } = item;
  const name = coach.display_name || coach.username || '';
  const openProfile = () => navigate(getProfilePathById(coach.user_id, undefined, coach.username ?? undefined));
  return <div className="watch-fy-coach" data-coach-card={coach.user_id} role="link" tabIndex={0} onClick={openProfile} onKeyDown={e => { if (e.key === 'Enter') openProfile(); }}>
    <div className="watch-fy-coach-row">
      <span className="watch-fy-coach-avatar">{coach.avatar_url ? <img src={coach.avatar_url} alt="" /> : <PlayerSilhouette />}</span>
      <div className="watch-fy-coach-text">
        <div className="watch-fy-coach-name">{name}</div>
        <div className="watch-fy-coach-line" data-coach-body>PGA Professional</div>
        {coach.pro_club?.trim() ? <div className="watch-fy-coach-line" data-coach-club>{coach.pro_club}</div> : null}
      </div>
    </div>
    <div className="watch-fy-coach-foot">
      <div><b data-coach-count>{videoCountLabel(videos.length)}</b><i>Videos</i></div>
      <FollowPill userId={coach.user_id} />
    </div>
  </div>;
}

export function CoachCards({ coaches }: { coaches: CoachWithVideos[] }) {
  return <>
    <div className="watch-fy-sublabel">The coaches</div>
    <FyRail label="coaches">{coaches.map(c => <CoachCard key={c.coach.user_id} item={c} />)}</FyRail>
  </>;
}

export function Box({ w, h, r }: { w: number; h: number; r: number }) {
  return <div className="clb-shimmer-dark watch-fy-shell" style={{ width: w, height: h, borderRadius: r }} />;
}

export function CoachingSkeleton() {
  return <div aria-hidden data-coaching-skeleton>
    <ForYouHeading eyebrow="Coaching" title="From the PGA pros" />
    <div className="watch-fy-rail" style={{ overflow: 'hidden' }}><Box w={156} h={248} r={12} /><Box w={156} h={248} r={12} /></div>
    <div className="watch-fy-sublabel">The coaches</div>
    <div className="watch-fy-rail" style={{ overflow: 'hidden' }}><Box w={236} h={136} r={18} /><Box w={236} h={136} r={18} /></div>
  </div>;
}

export function LongFormSkeleton() {
  return <div aria-hidden data-long-skeleton>
    <ForYouHeading eyebrow="Long form" title="Three minutes and over" />
    <div className="watch-fy-rail" style={{ overflow: 'hidden' }}><Box w={286} h={161} r={12} /><Box w={286} h={161} r={12} /></div>
  </div>;
}

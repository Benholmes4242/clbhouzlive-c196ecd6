/**
 * ER2 — CREATORS TO FOLLOW. Up to five creators from get_watch_spotlights,
 * picked once per Explore visit: WatchFeed mints the
 * visit key, so scroll, chip switches and back-from-viewer keep the same pick.
 * Hidden, heading included, with no row or on error. Follow state is kept per
 * visit, so the card stays (as Following) until the next visit.
 * Activity is one display-ordered batched read; canonical Clubhouse rings
 * and latest-post doors are imported unchanged, never reimplemented here.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { getProfilePathById } from '@/lib/profileRoutes';
import { toast } from '@/lib/toast';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { businessInitials } from '@/features/find-people/findPeopleRules';
import { ActiveAvatarDoor, ActiveRing } from '@/features/find-people/ActiveRing';
import { useRecentActivity, type RecentActivity } from '@/features/find-people/useRecentActivity';
import { ShelfHeading } from './CourseVideosShelf';
import { GlassDurationBadge } from '@/components/media/GlassDurationBadge';
import { Button } from '@/components/ui/button';
import './spotlight.css';
import { useCreatorVideos, useWatchSpotlights } from './useWatchBottom';
import { spotlightLine, spotlightPath, type SpotlightRow } from './watchBottom';
import { openVideoList } from './openVideoList';

const viewedVisits = new Set<string>();
const followedVisits = new Map<string, boolean>();
/** Test hook. */
export function __resetSpotlight() { viewedVisits.clear(); followedVisits.clear(); }

export function CreatorSpotlight({ userId, visitKey, onDepart }: { userId: string | null | undefined; visitKey: string; onDepart?: () => void }) {
  const { t } = useTranslation('courses');
  const q = useWatchSpotlights(userId, visitKey);
  const rows = q.data ?? [];
  const activityIds = useMemo(() => rows.map(row => row.actor_id), [q.data]);
  const activity = useRecentActivity(activityIds);
  const rail = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const dotTarget = useRef<number | null>(null);
  const scroll = () => {
    const el = rail.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-spotlight]'));
    const left = el.getBoundingClientRect().left + 16;
    const next = cards.reduce((best, card, i) => Math.abs(card.getBoundingClientRect().left - left) < Math.abs((cards[best]?.getBoundingClientRect().left ?? left) - left) ? i : best, 0);
    if (next !== activeRef.current) {
      activeRef.current = next; setActive(next);
      if (dotTarget.current == null) analyticsEvents.track('watch_spotlight_swiped', { to: next + 1 });
    }
    if (dotTarget.current === next) dotTarget.current = null;
  };
  if (!userId || q.isError || !rows.length) return null;
  return <div data-spotlight-section>
    <ShelfHeading title={t('amateur.watch.spotlight.title', 'Creators to follow')} />
    <div ref={rail} className="spotlight-rail" data-spotlight-rail data-single={rows.length === 1} onScroll={scroll}>
      {rows.map((row, i) => <SpotlightCard key={`${visitKey}:${row.actor_type}:${row.actor_id}`} row={row} activity={activity.get(row.actor_id)} visitKey={visitKey} position={i + 1} onDepart={onDepart} />)}
    </div>
    {rows.length > 1 ? <div className="spotlight-dots" data-spotlight-dots>{rows.map((row, i) => <Button key={`${row.actor_type}:${row.actor_id}`} variant="ghost" className="spotlight-dot" aria-label={`Creator ${i + 1}`} aria-pressed={active === i} onClick={() => {
      const el = rail.current; const card = el?.querySelectorAll<HTMLElement>('[data-spotlight]')[i];
      if (!el || !card) return;
      dotTarget.current = i;
      el.scrollTo({ left: el.scrollLeft + card.getBoundingClientRect().left - el.getBoundingClientRect().left - 16, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }}><span aria-hidden /></Button>)}</div> : null}
  </div>;
}

function SpotlightCard({ row, activity, visitKey, position, onDepart }: { row: SpotlightRow; activity?: RecentActivity; visitKey: string; position: number; onDepart?: () => void }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();
  const vids = useCreatorVideos(row?.actor_type ?? null, row?.actor_id ?? null);
  const actorKey = `${visitKey}:${row.actor_type}:${row.actor_id}`;
  const [following, setFollowing] = useState(() => followedVisits.get(actorKey) ?? row.following ?? false);
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    const el = ref.current;
    if (!el || viewedVisits.has(actorKey) || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !viewedVisits.has(actorKey)) {
        viewedVisits.add(actorKey);
        analyticsEvents.track('watch_spotlight_viewed', { actor_type: row.actor_type, position });
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [actorKey, row.actor_type, position]);


  const business = row.actor_type === 'business';
  const videos = (vids.data ?? []).slice(0, 3);
  const openProfile = () => navigate(spotlightPath(row, (id, handle) => getProfilePathById(id, undefined, handle ?? undefined)));

  const onFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id || pending) return;
    const prev = following;
    setFollowing(!prev);
    followedVisits.set(actorKey, !prev);
    setPending(true);
    try {
      await toggle.mutateAsync({
        targetActorType: row.actor_type as 'personal' | 'business',
        targetActorId: row.actor_id,
        targetUserId: business ? undefined : row.actor_id,
        viewerActorType: activeActor?.type ?? 'personal',
        viewerActorId: activeActor?.id ?? user.id,
        viewerUserId: user.id,
        isFollowing: prev,
      } as Parameters<typeof toggle.mutateAsync>[0]);
      if (!prev) analyticsEvents.track('watch_spotlight_follow', { actor_type: row.actor_type, position });
    } catch {
      setFollowing(prev);
      followedVisits.set(actorKey, prev);
      toast.error(prev ? 'Could not unfollow' : 'Could not follow');
    } finally {
      setPending(false);
    }
  };

  return (
    <div data-spotlight={row.actor_id} ref={ref} className="spotlight-card" style={{ fontFamily: SANS }}>
        <div
          data-spotlight-head
          role="link"
          tabIndex={0}
          onClick={openProfile}
          onKeyDown={(e) => { if (e.key === 'Enter') openProfile(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <ActiveAvatarDoor postId={activity?.post_id ?? null} label={`Open ${row.display_name ?? ''}'s latest post`} onOpen={(id) => navigate(`/post/${id}`)}>
          <ActiveRing active={!!activity} surface="card">
          {business && !row.avatar_url ? (
            <span data-spotlight-tile style={{ width: 56, height: 56, borderRadius: '34%', background: '#000', color: A.INK, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700 }}>
              {businessInitials(row.display_name ?? '')}
            </span>
          ) : (
            <SquircleAvatar size={56} src={row.avatar_url} alt={row.display_name ?? ''} userId={business ? null : row.actor_id} />
          )}
          </ActiveRing>
          </ActiveAvatarDoor>
          <div style={{ minWidth: 0, flex: 1 }}>
            <b data-spotlight-name style={{ display: 'block', fontSize: 17, fontWeight: 700, overflowWrap: 'anywhere' }}>
              {row.display_name}
              {row.is_verified ? <> <VerifiedBadge size="sm" className="inline align-middle" /></> : null}
            </b>
            <span data-spotlight-line className="spotlight-line">{spotlightLine(row, vids.isError ? null : videos[0]?.created_at)}</span>
          </div>
          <Button
            variant="ghost"
            className="spotlight-follow"
            type="button"
            data-spotlight-follow={following ? 'on' : 'off'}
            aria-pressed={following}
            disabled={pending}
            onClick={onFollow}
            style={{
              marginLeft: 'auto', flex: 'none', height: 32, padding: '0 14px', borderRadius: 999,
              fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {following ? t('amateur.watch.spotlight.following', 'Following') : t('amateur.watch.spotlight.follow', 'Follow')}
          </Button>
        </div>

        {videos.length > 0 ? (
          <div data-spotlight-videos style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {[0, 1, 2].map((i) => {
              const v = videos[i];
              if (!v) return <span key={i} aria-hidden style={{ flex: 1 }} />;
              return (
                <button
                  key={v.post_id}
                  type="button"
                  data-spotlight-video={v.post_id}
                  onClick={() => { analyticsEvents.track('watch_spotlight_video_opened', { position }); onDepart?.(); openVideoList(videos, i); }}
                  style={{ flex: 1, height: 150, borderRadius: 10, position: 'relative', overflow: 'hidden', padding: 0, border: 0, background: '#1E1E23', cursor: 'pointer' }}
                >
                  {v.poster_url ? <img src={v.poster_url} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  <span style={{ position: 'absolute', inset: 0 }}>
                    <GlassDurationBadge seconds={v.duration_seconds} placement="top-right" top={6} right={6} />
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
    </div>
  );
}

export default CreatorSpotlight;

/**
 * WS3 §2 — CREATOR TO FOLLOW (signed-off watch-s3 mocks A/B). One creator from
 * get_watch_spotlight(), picked once per Explore visit: WatchFeed mints the
 * visit key, so scroll, chip switches and back-from-viewer keep the same pick.
 * Hidden, heading included, with no row or on error. Follow state is kept per
 * visit, so the card stays (as Following) until the next visit.
 */
import { useEffect, useRef, useState } from 'react';
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
import { ShelfHeading, DurationChip } from './CourseVideosShelf';
import { useCreatorVideos, useWatchSpotlight } from './useWatchBottom';
import { spotlightCells, spotlightLine, spotlightPath, type SpotlightCell } from './watchBottom';
import { openVideoList } from './openVideoList';

const viewedVisits = new Set<string>();
const followedVisits = new Map<string, boolean>();
/** Test hook. */
export function __resetSpotlight() { viewedVisits.clear(); followedVisits.clear(); }

const CELL_LABEL: Record<SpotlightCell['key'], [string, string]> = {
  handicap: ['amateur.watch.spotlight.handicap', 'Handicap'],
  rounds: ['amateur.watch.spotlight.rounds', 'Rounds'],
  courses: ['amateur.watch.spotlight.courses', 'Courses'],
  videos: ['amateur.watch.spotlight.videos', 'Videos'],
  filmed: ['amateur.watch.spotlight.filmed', 'Courses filmed'],
};

export function CreatorSpotlight({ userId, visitKey, onDepart }: { userId: string | null | undefined; visitKey: string; onDepart?: () => void }) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();
  const q = useWatchSpotlight(userId, visitKey);
  const row = q.data ?? null;
  const vids = useCreatorVideos(row?.actor_type ?? null, row?.actor_id ?? null);
  const [following, setFollowing] = useState(() => followedVisits.get(visitKey) ?? false);
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const shown = !!userId && !q.isError && !!row;

  useEffect(() => {
    const el = ref.current;
    if (!shown || !el || viewedVisits.has(visitKey) || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !viewedVisits.has(visitKey)) {
        viewedVisits.add(visitKey);
        analyticsEvents.track('watch_spotlight_viewed', { actor_type: row?.actor_type });
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, visitKey, row?.actor_type]);

  if (!shown || !row) return null;

  const business = row.actor_type === 'business';
  const cells = spotlightCells(row);
  const videos = (vids.data ?? []).slice(0, 3);
  const openProfile = () => navigate(spotlightPath(row, (id, handle) => getProfilePathById(id, undefined, handle ?? undefined)));

  const onFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id || pending) return;
    const prev = following;
    setFollowing(!prev);
    followedVisits.set(visitKey, !prev);
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
      if (!prev) analyticsEvents.track('watch_spotlight_follow', { actor_type: row.actor_type });
    } catch {
      setFollowing(prev);
      followedVisits.set(visitKey, prev);
      toast.error(prev ? 'Could not unfollow' : 'Could not follow');
    } finally {
      setPending(false);
    }
  };

  return (
    <div data-spotlight={row.actor_id} ref={ref}>
      <ShelfHeading title={t('amateur.watch.spotlight.title', 'Creator to follow')} />
      <div style={{ margin: '0 16px', background: '#17171B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 16, fontFamily: SANS, color: A.INK }}>
        <div
          data-spotlight-head
          role="link"
          tabIndex={0}
          onClick={openProfile}
          onKeyDown={(e) => { if (e.key === 'Enter') openProfile(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          {business && !row.avatar_url ? (
            <span data-spotlight-tile style={{ width: 56, height: 56, borderRadius: '34%', background: '#000', color: A.INK, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700 }}>
              {businessInitials(row.display_name ?? '')}
            </span>
          ) : (
            <SquircleAvatar size={56} src={row.avatar_url} alt={row.display_name ?? ''} userId={business ? null : row.actor_id} hideRing={false} thinRing />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <b data-spotlight-name style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 17, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.display_name}</span>
              {row.is_verified ? <VerifiedBadge size="sm" /> : null}
            </b>
            <span data-spotlight-line style={{ display: 'block', fontSize: 12.5, color: A.MUTE, marginTop: 2 }}>{spotlightLine(row)}</span>
          </div>
          <button
            type="button"
            data-spotlight-follow={following ? 'on' : 'off'}
            aria-pressed={following}
            disabled={pending}
            onClick={onFollow}
            style={{
              marginLeft: 'auto', flex: 'none', height: 32, padding: '0 14px', borderRadius: 999,
              border: `1px solid ${following ? A.INK : 'rgba(255,255,255,0.22)'}`,
              background: following ? A.INK : 'transparent', color: following ? A.CANVAS : A.INK,
              fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {following ? t('amateur.watch.spotlight.following', 'Following') : t('amateur.watch.spotlight.follow', 'Follow')}
          </button>
        </div>

        <div data-spotlight-figs={cells.length} style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, background: '#1E1E23', borderRadius: 14, marginTop: 14 }}>
          {cells.map((c, i) => (
            <div key={c.key} data-spotlight-cell={c.key} style={{ padding: '11px 12px', borderLeft: i === 0 ? 0 : '1px solid rgba(255,255,255,0.06)' }}>
              <b style={{ display: 'block', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{c.value}</b>
              <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.DIM, marginTop: 3 }}>
                {t(CELL_LABEL[c.key][0], CELL_LABEL[c.key][1])}
              </span>
            </div>
          ))}
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
                  onClick={() => { analyticsEvents.track('watch_spotlight_video_opened'); onDepart?.(); openVideoList(videos, i); }}
                  style={{ flex: 1, height: 118, borderRadius: 10, position: 'relative', overflow: 'hidden', padding: 0, border: 0, background: '#1E1E23', cursor: 'pointer' }}
                >
                  {v.poster_url ? <img src={v.poster_url} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  <span style={{ position: 'absolute', inset: 0 }}>
                    <DurationChip seconds={v.duration_seconds} top={undefined as unknown as number} right={6} size={10.5} bottom={6} />
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CreatorSpotlight;

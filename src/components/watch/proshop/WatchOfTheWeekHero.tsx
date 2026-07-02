import { memo, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

import { useWatchOfTheWeek } from './hooks/useWatchOfTheWeek';
import { useWatchReveal, useWatchRevealed } from '../WatchRevealContext';
import { useWatchMood } from './hooks/useWatchMood';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { Kicker } from './Kicker';
import { Pin } from './Pin';
import { useActiveActor } from '@/context/ActiveActorContext';
import { isPostLikedByMe } from '@/lib/likedPostIds';
import DecodedImage from '../shared/DecodedImage';
import { attachHlsToTile } from '@/hooks/useTileVideoPlayer';
import { extractCloudflareUid } from '@/utils/videoIdUtils';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';


// Note: useNavigate import previously here was unused.


function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function WatchOfTheWeekHeroInner() {
  const { session } = useSupabaseSession();
  const { mood } = useWatchMood();
  const { data: pick, isLoading, dataUpdatedAt } = useWatchOfTheWeek(session?.user?.id, mood);
  const { activeActor } = useActiveActor();
  const actor = activeActor ? { id: activeActor.id, type: activeActor.type } : null;

  const { data: isLiked = false } = useQuery({
    queryKey: ['post-liked-by-me', pick?.post_id, actor?.id, actor?.type],
    queryFn: () => isPostLikedByMe(pick!.post_id, actor),
    enabled: !!pick?.post_id,
    staleTime: 60_000,
  });

  // Gate the reveal on both data + pixel: the hero image bitmap must have
  // decoded (or be empty) before we call markSettled.
  const [heroDecoded, setHeroDecoded] = useState(false);
  const heroTileRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const heroHlsRef = useRef<any>(null);
  const [heroInView, setHeroInView] = useState(false);
  const [heroVideoVisible, setHeroVideoVisible] = useState(false);
  const pageRevealed = useWatchRevealed();
  const reducedMotion = usePrefersReducedMotion();
  const hasResolved = dataUpdatedAt > 0;
  const isEmpty = hasResolved && (!pick || !pick.thumbnail_url);
  const heroReady = hasResolved && (isEmpty || heroDecoded);
  const revealed = useWatchReveal('watch-of-the-week', heroReady);

  // Track hero visibility for autoplay.
  useEffect(() => {
    const el = heroTileRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.intersectionRatio >= 0.6),
      { threshold: [0, 0.3, 0.6, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pick?.post_id]);

  // Slow-network guard (2g / saveData) — no autoplay.
  const isSlowNet = () => {
    if (typeof navigator === 'undefined') return false;
    const c: any = (navigator as any).connection;
    if (!c) return false;
    return c.effectiveType === '2g' || c.effectiveType === 'slow-2g' || c.saveData;
  };

  // Mount/tear-down hero video based on visibility gates.
  useEffect(() => {
    const tile = heroTileRef.current;
    const hlsUrl = pick?.hls_url;
    if (!tile || !hlsUrl) return;
    const canPlay =
      pageRevealed && heroInView && !reducedMotion && !isSlowNet();
    if (!canPlay) {
      setHeroVideoVisible(false);
      const v = heroVideoRef.current;
      if (v) {
        try { v.pause(); } catch {}
        v.removeAttribute('src');
        try { v.load(); } catch {}
        if (v.parentElement) v.parentElement.removeChild(v);
      }
      heroVideoRef.current = null;
      if (heroHlsRef.current) {
        try { heroHlsRef.current.destroy(); } catch {}
        heroHlsRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const v = document.createElement('video');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('muted', '');
    v.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;opacity:0;transition:opacity 200ms ease;z-index:0;';
    tile.appendChild(v);
    heroVideoRef.current = v;

    const onReady = () => {
      if (cancelled) return;
      v.style.opacity = '1';
      setHeroVideoVisible(true);
      v.play().catch(() => {});
    };

    attachHlsToTile({ hlsUrl, video: v, onReady })
      .then((hls) => {
        if (cancelled) {
          hls?.destroy?.();
          return;
        }
        heroHlsRef.current = hls;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      setHeroVideoVisible(false);
      const cur = heroVideoRef.current;
      if (cur) {
        try { cur.pause(); } catch {}
        cur.removeAttribute('src');
        try { cur.load(); } catch {}
        if (cur.parentElement) cur.parentElement.removeChild(cur);
      }
      heroVideoRef.current = null;
      if (heroHlsRef.current) {
        try { heroHlsRef.current.destroy(); } catch {}
        heroHlsRef.current = null;
      }
    };
  }, [pageRevealed, heroInView, reducedMotion, pick?.hls_url]);


  const skeleton = (
    <section style={{ padding: '24px 16px 12px' }}>
      <div
        style={{
          width: 140,
          height: 12,
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
          marginBottom: 10,
        }}
      />
      <div
        style={{
          width: '100%',
          aspectRatio: '16/10',
          borderRadius: 12,
          background: 'rgba(0,0,0,0.06)',
          backgroundImage:
            'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'clb-shimmer 1.5s ease-in-out infinite',
        }}
      />
    </section>
  );

  if (!hasResolved || isLoading) return skeleton;
  if (!pick) return null;


  const handleTap = () => {
    // Open fullscreen viewer with a synthetic single-post array. The viewer
    // accepts the FeedPost shape; we provide the minimum fields it needs.
    openWithOrigin({
      originEl: heroTileRef.current,
      posterUrl: pick.thumbnail_url ?? null,
      handOffUrls: [pick.hls_url ?? undefined],
      index: 0,
      posts:
      [{
        id: pick.post_id,
        userId: pick.user_id,
        actorType: 'personal',
        actorId: pick.user_id,
        username: pick.username ?? '',
        displayName: pick.display_name ?? '',
        avatarUrl: pick.avatar_url ?? '',
        isVerified: pick.is_verified,
        creatorRelation: 'none',
        caption: pick.caption ?? '',
        mediaItems: [{
          id: pick.post_id,
          type: 'video',
          hlsUrl: pick.hls_url ?? undefined,
          imageUrl: pick.thumbnail_url ?? undefined,
          thumbnailUrl: pick.thumbnail_url ?? undefined,
          streamId: pick.stream_id ?? (pick.hls_url ? extractCloudflareUid(pick.hls_url) : null),
          width: 0,
          height: 0,
          duration: pick.duration_seconds ?? undefined,
        }],

        createdAt: pick.created_at,
        likeCount: pick.like_count,
        commentCount: pick.comment_count,
        shareCount: 0,
        review: null,
        isReview: false,
        isLikedByMe: isLiked,
        isFollowedByMe: false,
        courseName: pick.course_name ?? undefined,
        courseId: pick.course_id ?? undefined,
        tags: (pick as any).post_tags ?? [],
      } as any],
      0,
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      <motion.section
        initial={false}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.18 }}
        style={{ padding: '24px 16px 12px', pointerEvents: revealed ? 'auto' : 'none' }}
      >
        <Kicker color="amber">Watch of the Week</Kicker>

        <button
          type="button"
          onClick={handleTap}
          className="block w-full text-left active:scale-[0.99] transition-transform"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/10',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'transparent',
            border: 'none',
            padding: 0,
            marginTop: 6,
          }}
        >
          <div ref={heroTileRef} style={{ position: 'absolute', inset: 0 }}>
            {pick.thumbnail_url ? (
              <DecodedImage
                src={pick.thumbnail_url}
                alt={pick.caption ?? ''}
                loading="lazy"
                onDecoded={() => setHeroDecoded(true)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: heroVideoVisible ? 0 : 1,
                  transition: 'opacity 200ms ease',
                }}
              />
            ) : null}
          </div>



          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)',
            }}
          />

          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, maxWidth: 'calc(100% - 80px)' }}>
            <Pin variant="dark">{pick.format === 'clip' ? 'CLIP' : 'VIDEO'}</Pin>
            {pick.course_name ? (
              <Pin variant="dark" icon={<span style={{ fontSize: 10 }}>📍</span>}>
                {pick.course_name}
              </Pin>
            ) : null}
          </div>

          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, color: 'white' }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                lineHeight: 1.25,
                letterSpacing: '-0.015em',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}
            >
              {pick.caption || (pick.display_name ? `${pick.display_name} on Clbhouz` : 'Featured')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11, fontWeight: 600, opacity: 0.9 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pick.display_name || pick.username || 'Clbhouz'}
              </span>
              {pick.duration_seconds ? <span aria-hidden>·</span> : null}
              {pick.duration_seconds ? <span>{formatDuration(pick.duration_seconds)}</span> : null}
            </div>
          </div>
        </button>

        {pick.why_ai ? (
          <p
            style={{
              marginTop: 12,
              fontSize: 13,
              lineHeight: 1.5,
              color: 'rgba(15,23,42,0.72)',
            }}
          >
            <span style={{ fontWeight: 700, color: '#0F172A' }}>Why we're featuring this: </span>
            {pick.why_ai}
          </p>
        ) : null}
      </motion.section>

      {!revealed && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {skeleton}
        </div>
      )}
    </div>
  );
}

export const WatchOfTheWeekHero = memo(WatchOfTheWeekHeroInner);

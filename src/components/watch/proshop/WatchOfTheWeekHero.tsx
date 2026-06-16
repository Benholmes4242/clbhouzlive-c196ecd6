import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useWatchOfTheWeek, type WatchOfTheWeek } from './hooks/useWatchOfTheWeek';
import { useWatchMood } from './hooks/useWatchMood';
import { useWatchFeed } from '../hooks/useWatchFeed';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Kicker } from './Kicker';
import { Pin } from './Pin';
import { useActiveActor } from '@/context/ActiveActorContext';
import { isPostLikedByMe } from '@/lib/likedPostIds';
import { useMediaAutoplay } from '@/media';
import { attachHlsToTile } from '@/hooks/useTileVideoPlayer';
import { HLSPoolManager } from '@/media/HLSPoolManager';
import { MediaRuntime } from '@/media/runtime';
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
  const { data: pick, isLoading } = useWatchOfTheWeek(session?.user?.id, mood);
  const { activeActor } = useActiveActor();
  const actor = activeActor ? { id: activeActor.id, type: activeActor.type } : null;

  // Fallback feed — only actually needed when pick is null, but hooks must be unconditional.
  const { posts } = useWatchFeed({
    userId: session?.user?.id,
    filter: 'top',
  });

  // Build a fallback "pick" from the top-liked VIDEO post (mirrors TrendingThisWeek.topPosts).
  const fallbackPick = useMemo<WatchOfTheWeek | null>(() => {
    if (pick) return null; // editorial pick wins
    const topVideo = [...(posts ?? [])]
      .filter(p => p.mediaItems?.[0]?.type === 'video' && p.mediaItems[0]?.hlsUrl)
      .sort((a, b) => b.likeCount - a.likeCount)[0];
    if (!topVideo) return null;
    const m = topVideo.mediaItems[0];
    return {
      post_id: topVideo.id,
      user_id: topVideo.userId,
      course_id: null,
      course_name: topVideo.courseName ?? null,
      caption: topVideo.caption ?? null,
      thumbnail_url: m.thumbnailUrl ?? null,
      hls_url: m.hlsUrl ?? null,
      duration_seconds: null,
      format: 'video',
      username: topVideo.username ?? null,
      display_name: topVideo.displayName ?? null,
      avatar_url: topVideo.avatarUrl ?? null,
      is_verified: false,
      like_count: topVideo.likeCount ?? 0,
      comment_count: topVideo.commentCount ?? 0,
      created_at: topVideo.createdAt ?? new Date().toISOString(),
      why_ai: null,
    };
  }, [pick, posts]);

  const effectivePick = pick ?? fallbackPick;

  const { data: isLiked = false } = useQuery({
    queryKey: ['post-liked-by-me', effectivePick?.post_id, actor?.id, actor?.type],
    queryFn: () => isPostLikedByMe(effectivePick!.post_id, actor),
    enabled: !!effectivePick?.post_id,
    staleTime: 60_000,
  });

  // ── Phase WatchSpotlight-D: register hero as a 'watch' spotlight candidate.
  // sortIndex: 0 so it wins at the top of the page when equally visible.
  const { registerMedia, playingIds, visibleIds } = useMediaAutoplay({
    mode: 'grid',
    surface: 'watch',
    startThreshold: 0.5,
    stopThreshold: 0.25,
  });
  const mediaId = effectivePick ? `watch-hero-${effectivePick.post_id}` : '';
  const hlsUrl = effectivePick?.hls_url ?? undefined;
  const isPlaying = !!mediaId && playingIds.has(mediaId);
  const isVisibleCandidate = !!mediaId && visibleIds.has(mediaId);
  const [videoVisible, setVideoVisible] = useState(false);

  // Stable ref-callback pattern (same loop-fix as WatchTile).
  const registerRef = useRef(registerMedia);
  registerRef.current = registerMedia;
  const heroWrapperRef = useRef<HTMLButtonElement | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);

  // Wrapper ref OWNS register/unregister lifecycle. React attaches child
  // refs before parent refs, so an inner-only register/unregister pattern
  // would demote itself at mount (wrapper null on first video ref pass).
  // The wrapper ref runs LAST → safe to converge registration here.
  const wrapperRefCallback = useCallback(
    (el: HTMLButtonElement | null) => {
      heroWrapperRef.current = el;
      const register = registerRef.current;
      if (!register || !mediaId) return;
      if (el && videoElRef.current) {
        register({
          id: mediaId,
          element: videoElRef.current,
          observeTarget: el,
          sortIndex: 0,
          isCandidate: !!hlsUrl,
        });
      } else {
        register({ id: mediaId, element: null });
      }
    },
    [mediaId, hlsUrl],
  );

  // Inner video ref only REGISTERS (never unregisters) — so child-first
  // ref ordering can't demote the registration. Wrapper owns teardown.
  const videoRefCallback = useCallback(
    (el: HTMLVideoElement | null) => {
      videoElRef.current = el;
      const register = registerRef.current;
      if (!register || !mediaId) return;
      if (el && heroWrapperRef.current) {
        register({
          id: mediaId,
          element: el,
          observeTarget: heroWrapperRef.current,
          sortIndex: 0,
          isCandidate: !!hlsUrl,
        });
      }
      // NO else/unregister here — wrapper owns teardown.
    },
    [mediaId, hlsUrl],
  );

  // Attach HLS when runtime picks us; demote-to-pool on the way out.
  useEffect(() => {
    const v = videoElRef.current;
    if (!v || !isPlaying || !hlsUrl) return;
    let cancelled = false;
    const onReady = () => {
      if (cancelled) return;
      setVideoVisible(true);
      v.play().catch(() => {});
    };
    attachHlsToTile({ hlsUrl, video: v, onReady })
      .then((hls) => {
        if (cancelled) {
          if (hls && HLSPoolManager.isPooled(hlsUrl)) {
            try { HLSPoolManager.demote(hlsUrl, hls); } catch {}
          } else {
            try { hls?.destroy?.(); } catch {}
          }
          return;
        }
        hlsRef.current = hls;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      setVideoVisible(false);
      const hls = hlsRef.current;
      if (hls) {
        if (HLSPoolManager.isPooled(hlsUrl)) {
          try { HLSPoolManager.demote(hlsUrl, hls); } catch {}
        } else {
          try { hls.stopLoad?.(); } catch {}
          try { hls.detachMedia?.(); } catch {}
          try { hls.destroy?.(); } catch {}
        }
        hlsRef.current = null;
      }
      try { v.pause(); } catch {}
    };
  }, [isPlaying, hlsUrl]);

  if (isLoading || !effectivePick) return null;

  const handleTap = () => {
    // Open fullscreen viewer with a synthetic single-post array. The viewer
    // accepts the FeedPost shape; we provide the minimum fields it needs.
    useFullscreenFeedStore.getState().open(
      [{
        id: effectivePick.post_id,
        userId: effectivePick.user_id,
        actorType: 'personal',
        actorId: effectivePick.user_id,
        username: effectivePick.username ?? '',
        displayName: effectivePick.display_name ?? '',
        avatarUrl: effectivePick.avatar_url ?? '',
        isVerified: effectivePick.is_verified,
        creatorRelation: 'none',
        caption: effectivePick.caption ?? '',
        mediaItems: [{
          id: effectivePick.post_id,
          type: 'video',
          hlsUrl: effectivePick.hls_url ?? undefined,
          imageUrl: effectivePick.thumbnail_url ?? undefined,
          thumbnailUrl: effectivePick.thumbnail_url ?? undefined,
          width: 0,
          height: 0,
          duration: effectivePick.duration_seconds ?? undefined,
        }],
        createdAt: effectivePick.created_at,
        likeCount: effectivePick.like_count,
        commentCount: effectivePick.comment_count,
        shareCount: 0,
        review: null,
        isReview: false,
        isLikedByMe: isLiked,
        isFollowedByMe: false,
        courseName: effectivePick.course_name ?? undefined,
        courseId: effectivePick.course_id ?? undefined,
        tags: (effectivePick as any).post_tags ?? [],
      } as any],
      0,
    );
  };

  return (
    <section style={{ padding: '24px 16px 12px' }}>
      <Kicker color="amber">Watch of the Week</Kicker>

      <button
        ref={wrapperRefCallback}
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
        {effectivePick.thumbnail_url ? (
          <img
            src={effectivePick.thumbnail_url}
            alt={effectivePick.caption ?? ''}
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}

        {/* Runtime-arbitrated autoplay layer — fades in above the poster
            when MediaRuntime picks the hero as the 'watch' spotlight. */}
        {hlsUrl ? (
          <video
            ref={videoRefCallback}
            muted
            loop
            playsInline
            preload="none"
            // @ts-ignore webkit-only attribute
            webkit-playsinline=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              zIndex: 1,
              opacity: videoVisible ? 1 : 0,
              transition: 'opacity 200ms ease',
            }}
          />
        ) : null}

        {/* Bottom gradient */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)',
          }}
        />


        {/* Top-left badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, display: 'flex', gap: 6, maxWidth: 'calc(100% - 80px)' }}>
          <Pin variant="dark">{effectivePick.format === 'clip' ? 'CLIP' : 'VIDEO'}</Pin>
          {effectivePick.course_name ? (
            <Pin variant="dark" icon={<span style={{ fontSize: 10 }}>📍</span>}>
              {effectivePick.course_name}
            </Pin>
          ) : null}
        </div>

        {/* Bottom: title + creator + duration */}
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, zIndex: 3, color: 'white' }}>
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
            {effectivePick.caption || (effectivePick.display_name ? `${effectivePick.display_name} on Clbhouz` : 'Featured')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11, fontWeight: 600, opacity: 0.9 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {effectivePick.display_name || effectivePick.username || 'Clbhouz'}
            </span>
            {effectivePick.duration_seconds ? <span aria-hidden>·</span> : null}
            {effectivePick.duration_seconds ? <span>{formatDuration(effectivePick.duration_seconds)}</span> : null}
          </div>
        </div>
      </button>

      {effectivePick.why_ai ? (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            lineHeight: 1.5,
            color: 'rgba(15,23,42,0.72)',
          }}
        >
          <span style={{ fontWeight: 700, color: '#0F172A' }}>Why we're featuring this: </span>
          {effectivePick.why_ai}
        </p>
      ) : null}
    </section>
  );
}

export const WatchOfTheWeekHero = memo(WatchOfTheWeekHeroInner);

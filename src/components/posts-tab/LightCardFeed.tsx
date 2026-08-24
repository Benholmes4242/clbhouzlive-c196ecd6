/**
 * LightCardFeed — the WINDOW-SCROLLED, virtualized profile feed. Dark, like
 * everything else: "Light" in the name is a fossil of the light era and says
 * nothing about this component's reason to exist.
 *
 * It exists because it window-scrolls, so the profile hero scrolls away
 * naturally, while Clubhouse's `CardFeed` owns its own scroller. That
 * scrolling architecture is the decision; the theme was incidental to it.
 *
 * Built ground-up for the profile Activity / Posts tab (personal + business).
 * Uses `react-virtuoso` with `useWindowScroll` so the page hero scrolls away
 * naturally while DOM footprint stays bounded — iOS WebView <video> /
 * compositor budgets stay safe on power-user profiles with hundreds of posts.
 *
 * Active-card tracking (center-proximity IntersectionObserver + settle-gated
 * playingIdx) is ported verbatim from the dark Clubhouse `CardFeed`; it's
 * theme-neutral and must survive so inline video autoplay still promotes the
 * centred card and respects the neighbour decoder budget.
 *
 * Clubhouse `CardFeed`/`FeedCard` are untouched.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFeedCommentPreview } from '@/hooks/feed/useFeedCommentPreview';
import { Virtuoso } from 'react-virtuoso';
import type { FeedPost } from '@/components/media-system/types/media';
import type { ActiveActor } from '@/types/actor';
import type { PostCourseContext } from '@/hooks/feed/usePostCourseContext';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { isPerfEnabled } from '@/perf/navTiming';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { getPrimaryScrollElement } from '@/lib/getScrollParent';
import { VideoEngine } from '@/video/VideoEngine';
import { feedLaneRoles } from '@/video/feedLaneRoles';
import { isPerfEnabled as _isPerfEnabledForRotate } from '@/perf/navTiming';
import { vperfFeedActivateStart, vperfFeedActivateEnd, vperfConsumeEarlyStarted } from '@/perf/vperf';
import { FeedCard } from '@/components/feed/FeedCard';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const PAGE_BG = A.CANVAS;
/* Inter-card band. Same value and same 5px height as CARD_BAND in StatBrowse
   and VirtualizedCourseList — three local declarations, deliberately not
   extracted. */
const DIVIDER = 'rgba(255,255,255,0.06)';

/** How many neighbours on each side of the active card may mount a <video>. */
const VIDEO_NEIGHBOUR_RADIUS = 1;

/** See CardFeed.FeedItemGate — same rationale (decouple viewer-open from
 *  `itemContent` identity so react-virtuoso doesn't remount the borrowed card). */
const LightItemGate: React.FC<{
  post: FeedPost;
  index: number;
  playingIdx: number;
  activeIdx: number;
  earlyIdx: number;
  children: (v: { isActive: boolean; mountVideo: boolean; earlyMotion: boolean }) => React.ReactNode;
}> = ({ post, index, playingIdx, activeIdx, earlyIdx, children }) => {
  const fsOpen = useFullscreenFeedStore((s) => s.isOpen);
  const borrowedOwnerKey = useFullscreenFeedStore((s) => s.borrow?.ownerKey ?? null);
  const isBorrowedCard =
    fsOpen && !!borrowedOwnerKey &&
    (borrowedOwnerKey === post.id || borrowedOwnerKey.startsWith(`${post.id}:`));
  const isActive = !fsOpen && index === playingIdx;
  const isNear =
    isBorrowedCard || (!fsOpen && Math.abs(index - activeIdx) <= VIDEO_NEIGHBOUR_RADIUS);
  const earlyMotion = !fsOpen && index === earlyIdx && index !== playingIdx;
  return <>{children({ isActive, mountVideo: isNear, earlyMotion })}</>;
};

export interface LightCardFeedProps {
  posts: FeedPost[];
  onLike: (post: FeedPost, actor?: ActiveActor | null) => void;
  onComment: (post: FeedPost, actor?: ActiveActor | null) => void;
  onShare: (post: FeedPost) => void;
  onProfile: (post: FeedPost) => void;
  onReviewTap?: (post: FeedPost) => void;
  onCourse?: (post: FeedPost) => void;
  getLikeState: (post: FeedPost) => { liked: boolean; count: number } | null | undefined;
  getCommentCount: (post: FeedPost) => number;
  onNearEnd?: () => void;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  topPadding?: number | string;
  bottomPadding?: number;
  onFollow?: (post: FeedPost) => void;
  currentUserId?: string;
  /** Batched course enrichment, resolved once in PostsTabContent. */
  courseContextMap?: Map<string, PostCourseContext>;
  resolveCourseId?: (post: FeedPost) => string | null;
  /** post.id -> whs score id, and score id -> round (both batched at page level). */
  postScoreIdMap?: Map<string, string>;
  postRoundMap?: Map<string, PostRound>;
  /** False while the batched round chain is still in flight (shell state). */
  postRoundsSettled?: boolean;
  onRoundTap?: (post: FeedPost, round: PostRound) => void;
}

export const LightCardFeed: React.FC<LightCardFeedProps> = ({
  posts,
  onLike,
  onComment,
  onShare,
  onProfile,
  onReviewTap,
  onCourse,
  getLikeState,
  getCommentCount,
  onNearEnd,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  topPadding = 0,
  bottomPadding = 32,
  onFollow,
  currentUserId,
  courseContextMap,
  resolveCourseId,
  postScoreIdMap,
  postRoundMap,
  postRoundsSettled = true,
  onRoundTap,
}) => {
  // ── Active-card tracking (ported from CardFeed) ──
  /**
   * ONE comments_v2 read per loaded page for the inline comment preview — the
   * SAME hook CardFeed calls, keyed on the post ids this feed has loaded. A
   * second hook would be a second copy of the target_type/parent_id rules.
   */
  const feedPostIds = useMemo(() => posts.map((p) => p.id), [posts]);
  const commentPreview = useFeedCommentPreview(feedPostIds, 'posts:cards');

  const [activeIdx, setActiveIdx] = useState(0);
  const [playingIdx, setPlayingIdx] = useState(0);
  const [earlyIdx, setEarlyIdx] = useState<number>(-1);
  const [scrollParent, setScrollParent] = useState<HTMLElement | undefined>(undefined);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SETTLE_MS = 80;
  // IG-style early activation: cheap now that feed-next preload + PREDICT cache
  // warming + bandwidth seeding are in place. Playing by ~1/3 up feels native.
  const PLAY_IN = 0.30;
  const PLAY_OUT = 0.20;
  const HYSTERESIS = 0.1;
  // Early-motion handover (mirrors CardFeed) — see CardFeed.EARLY_MOTION_*
  const EARLY_MOTION_FRACTION = 0.12;
  const EARLY_MOTION_CLEAR = 0.08;
  const EARLY_VELOCITY_MAX = 3; // px/ms
  const visibilityRef = useRef<Map<number, number>>(new Map());
  const scrollDirRef = useRef<number>(0); // +1 down, -1 up, 0 idle
  const lastScrollTopRef = useRef<number>(0);
  const lastScrollTsRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0); // px/ms
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardEls = useRef<Map<number, HTMLElement>>(new Map());
  const playingIdxRef = useRef(0);
  const postsRef = useRef(posts);
  useEffect(() => { playingIdxRef.current = playingIdx; }, [playingIdx]);
  useEffect(() => { postsRef.current = posts; }, [posts]);

  useEffect(() => {
    setScrollParent(getPrimaryScrollElement());
  }, []);



  // Promotion → rotate roles first, then flip playingIdx. See CardFeed for the
  // full rationale (seamless-promotion invariant).
  const lastPromotedRef = useRef<number>(0);
  useEffect(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const prev = lastPromotedRef.current;
      const next = activeIdx;
      if (next !== prev && next >= 0 && prev >= 0) {
        const dir: 'down' | 'up' = next > prev ? 'down' : 'up';
        const recycled = feedLaneRoles.rotate(dir);
        if (_isPerfEnabledForRotate()) {
          const snap = feedLaneRoles.snapshot();
          // eslint-disable-next-line no-console
          console.info('[DECIDE]', 'rotation.promote', {
            direction: dir, fromIdx: prev, toIdx: next,
            recycledLane: recycled, borrowedFrozen: snap.frozen,
            map: { active: snap.active, next: snap.next, prev: snap.prev },
            surface: 'posts-tab',
          });
        }
      }
      lastPromotedRef.current = next;
      setPlayingIdx(next);
    }, SETTLE_MS);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [activeIdx]);

  const recheckActive = useCallback(() => {
    let bestIdx = -1;
    let bestRatio = 0;
    const eligible: number[] = [];
    visibilityRef.current.forEach((ratio, idx) => {
      if (ratio > bestRatio) { bestRatio = ratio; bestIdx = idx; }
      if (ratio >= PLAY_IN) eligible.push(idx);
    });

    // Directional tie-break: prefer the card entering in the scroll direction.
    let dirWinner = -1;
    if (eligible.length > 1 && scrollDirRef.current !== 0) {
      dirWinner = scrollDirRef.current > 0
        ? Math.max(...eligible)
        : Math.min(...eligible);
    }

    setActiveIdx((prev) => {
      const prevRatio = prev >= 0 ? (visibilityRef.current.get(prev) ?? 0) : 0;
      if (prev >= 0 && prevRatio >= PLAY_OUT && (bestRatio - prevRatio) < HYSTERESIS) return prev;
      if (dirWinner >= 0) return dirWinner;
      if (bestIdx >= 0 && bestRatio >= PLAY_IN) return bestIdx;
      if (prev >= 0 && prevRatio >= PLAY_OUT) return prev;
      return bestIdx >= 0 && bestRatio >= PLAY_OUT ? bestIdx : prev;
    });

    // Early-motion candidate — mirrors CardFeed. See there for the rationale.
    setEarlyIdx((prevEarly) => {
      const dir = scrollDirRef.current;
      const vel = scrollVelocityRef.current;
      const currentPlay = playingIdxRef.current;
      if (dir === 0 || vel > EARLY_VELOCITY_MAX || currentPlay < 0) return -1;
      const cand = currentPlay + dir;
      if (cand < 0 || cand >= postsRef.current.length) return -1;
      const ratio = visibilityRef.current.get(cand) ?? 0;
      if (prevEarly === cand && ratio >= EARLY_MOTION_CLEAR) return cand;
      if (prevEarly !== cand && ratio < EARLY_MOTION_FRACTION) return -1;
      if (ratio < EARLY_MOTION_CLEAR) return -1;
      // Warm-only guard via role lookup — see CardFeed for rationale.
      const cardPost = postsRef.current[cand];
      if (!cardPost) return -1;
      try {
        const laneId = feedLaneRoles.laneForRole(dir > 0 ? 'next' : 'prev');
        const snap = VideoEngine.snapshot(laneId);
        const warm = snap.postId != null &&
          (snap.postId === cardPost.id || snap.postId === `${cardPost.id}:0`) &&
          (snap.state === 'ready' || snap.state === 'playing' || snap.state === 'loading');
        if (!warm) return -1;
      } catch { return -1; }
      return cand;
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.cardIndex);
          if (Number.isNaN(idx)) continue;
          if (e.isIntersecting) visibilityRef.current.set(idx, e.intersectionRatio);
          else visibilityRef.current.delete(idx);
        }
        recheckActive();
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] },
    );
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      observerRef.current = null;
      visibilityRef.current.clear();
      cardEls.current.clear();
    };
  }, [recheckActive]);

  useEffect(() => {
    let raf = 0;
    const scroller: HTMLElement | Window = document.getElementById('root') ?? window;
    const readScrollTop = () =>
      scroller instanceof Window ? scroller.scrollY : (scroller as HTMLElement).scrollTop;
    const onScroll = () => {
      const st = readScrollTop();
      const now = performance.now();
      const dy = st - lastScrollTopRef.current;
      const dt = Math.max(1, now - (lastScrollTsRef.current || now));
      const inst = Math.abs(dy) / dt;
      scrollVelocityRef.current = scrollVelocityRef.current * 0.5 + inst * 0.5;
      if (Math.abs(dy) > 0.5) scrollDirRef.current = dy > 0 ? 1 : -1;
      lastScrollTopRef.current = st;
      lastScrollTsRef.current = now;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        recheckActive();
      });
    };
    scroller.addEventListener('scroll', onScroll, { passive: true, capture: true } as AddEventListenerOptions);
    return () => {
      scroller.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [recheckActive]);

  // Symmetric neighbour warm-up via role lookup — see CardFeed.
  useEffect(() => {
    const warm = (role: 'next' | 'prev', post: FeedPost | undefined) => {
      const m = post?.mediaItems?.[0];
      if (!post || !m || m.type !== 'video' || !m.hlsUrl) return;
      try {
        const laneId = feedLaneRoles.laneForRole(role);
        VideoEngine.preload(laneId, {
          hlsUrl: m.hlsUrl,
          posterUrl: m.thumbnailUrl ?? null,
          postId: `${post.id}:0`,
        });
      } catch { /* engine may not be booted yet — safe to ignore */ }
    };
    warm('next', posts[playingIdx + 1]);
    warm('prev', posts[playingIdx - 1]);
  }, [playingIdx, posts]);

  // Promotion + fullscreen clears — see CardFeed for rationale.
  useEffect(() => {
    if (earlyIdx === playingIdx && earlyIdx !== -1) setEarlyIdx(-1);
  }, [earlyIdx, playingIdx]);
  const fsIsOpen = useFullscreenFeedStore((s) => s.isOpen);
  useEffect(() => {
    if (fsIsOpen && earlyIdx !== -1) setEarlyIdx(-1);
  }, [fsIsOpen, earlyIdx]);

  // ── Resume after a borrow returns (profile feed only) ──
  // The viewer borrows the 'active' physical lane and, on close, returns it at
  // role 'prev' (the shared default, correct for the Clubhouse feed). On a
  // profile the member comes back to the very card they tapped — it is still
  // the on-screen card — so we re-assert active for whichever physical lane
  // holds the CURRENTLY VISIBLE card's media. Pure role bookkeeping: the
  // element is already parented and paused at its true position, so it
  // resumes rather than reloads. If the member scrolled while the viewer was
  // open, no lane matches the visible card and we leave the roles alone.
  const wasFsOpenRef = useRef(false);
  useEffect(() => {
    const closed = wasFsOpenRef.current && !fsIsOpen;
    wasFsOpenRef.current = fsIsOpen;
    if (!closed) return;
    const post = postsRef.current[playingIdxRef.current];
    const m = post?.mediaItems?.[0];
    if (!post || !m || m.type !== 'video') return;
    const target = `${post.id}:0`;
    try {
      for (const r of ['prev', 'next'] as const) {
        const lane = feedLaneRoles.laneForRole(r);
        const snap = VideoEngine.snapshot(lane);
        const key = snap.postId == null
          ? null
          : (snap.postId.includes(':') ? snap.postId : `${snap.postId}:0`);
        if (key === target) {
          feedLaneRoles.promoteToActive(lane);
          break;
        }
      }
      // Resume + speak explicitly. Role bookkeeping alone is not enough: when
      // the promoted lane's id is unchanged for the card's InlineVideo, its
      // play-effect deps don't change and no play() is issued, so the returned
      // element stays paused. Issuing play + claiming audio focus here is the
      // Clubhouse-equivalent end state (playing, unmuted if the session is).
      const activeLane = feedLaneRoles.laneForRole('active');
      VideoEngine.setAudioFocus(activeLane, 'feed');
      void VideoEngine.play(activeLane, { callerPostId: target });
    } catch { /* engine not booted */ }
  }, [fsIsOpen]);

  // v11 audio-focus — the profile feed must register its active lane exactly
  // as the Clubhouse CardFeed does. Without this the reconciler resolves
  // `whyNone: 'no-audio-focus'` and force-mutes every lane, so unmuting via
  // the MuteButton produced no audio on personal or business profiles.
  useEffect(() => {
    if (fsIsOpen) return; // overlay branch owns the speaker while open
    const post = posts[playingIdx];
    if (!post) return;
    const hasVideo = post.mediaItems?.some?.((m) => m?.type === 'video');
    try {
      if (hasVideo) {
        VideoEngine.setAudioFocus(feedLaneRoles.laneForRole('active'), 'feed');
      } else {
        VideoEngine.setAudioFocus(null, 'feed');
      }
    } catch { /* engine may not be booted yet — safe to ignore */ }
  }, [fsIsOpen, playingIdx, posts]);

  useEffect(() => {
    return () => {
      try { VideoEngine.setAudioFocus(null, 'feed'); } catch { /* noop */ }
    };
  }, []);




  // Activation scorecard — one feed.activate emit per promotion.
  const activateT0Ref = useRef<number>(0);
  useEffect(() => {
    const post = posts[playingIdx];
    if (!post) return;
    const ownerKey = `${post.id}:0`;
    const hasVideo = post.mediaItems?.some?.((m) => m?.type === 'video');
    const mediaType: 'image' | 'video' = hasVideo ? 'video' : 'image';
    activateT0Ref.current = vperfFeedActivateStart('posts-tab');
    const raf = requestAnimationFrame(() => {
      vperfFeedActivateEnd({
        t0: activateT0Ref.current,
        idx: playingIdx,
        mediaType,
        earlyStarted: vperfConsumeEarlyStarted(ownerKey),
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [playingIdx, posts]);

  const setActiveIndex = useClubhouseStore((s) => s.setActiveIndex);
  const setCarouselPosition = useClubhouseStore((s) => s.setCarouselPosition);
  const carouselPositions = useClubhouseStore((s) => s.carouselPositions);
  const openFullscreen = useFullscreenFeedStore((s) => s.open);
  // fsOpen / borrow.ownerKey consumed inside `LightItemGate` — see CardFeed.

  useEffect(() => {
    setActiveIndex(activeIdx);
  }, [activeIdx, setActiveIndex]);

  const handleOpenMedia = useCallback(
    (
      post: FeedPost,
      mediaIndex: number,
      origin?: { el: HTMLElement | null; posterUrl?: string | null },
      mediaId?: string | null,
      ownerKey?: string | null,
    ) => {
      const idx = posts.findIndex((p) => p.id === post.id);
      if (idx < 0) return;
      setActiveIndex(idx);
      if (mediaIndex > 0) setCarouselPosition(idx, mediaIndex);
      if (isPerfEnabled()) {
        // eslint-disable-next-line no-console
        console.info('[DECIDE]', 'tap.context', {
          postId: post.id,
          mediaId: mediaId ?? null,
          ownerKey: ownerKey ?? null,
          hasOrigin: !!origin?.el,
          isActiveCard: idx === playingIdx,
          playingIdx,
          tappedIdx: idx,
          surface: 'posts-tab',
        });
      }
      if (origin?.el) {
        openWithOrigin({
          openedFrom: 'posts-tab',
          posts,
          index: idx,
          originEl: origin.el,
          posterUrl: origin.posterUrl ?? null,
          mediaId: mediaId ?? null,
          mediaIndex,
          railOwnerKey: ownerKey ?? null,
          options: {
            hasNextPage: hasNextPage ?? false,
            fetchNextPage: hasNextPage ? fetchNextPage : undefined,
            isFetchingNextPage: isFetchingNextPage ?? false,
          },
        });
      } else {
        openFullscreen(posts, idx, {
          mediaId: mediaId ?? null,
          openedFrom: 'posts-tab',
          hasNextPage: hasNextPage ?? false,
          fetchNextPage: hasNextPage ? fetchNextPage : undefined,
          isFetchingNextPage: isFetchingNextPage ?? false,
        });

      }
    },
    [posts, setActiveIndex, setCarouselPosition, openFullscreen, hasNextPage, fetchNextPage, isFetchingNextPage, playingIdx],
  );

  const carouselChangeCacheRef = useRef(new Map<string, (post: FeedPost, slide: number) => void>());
  const getCarouselChangeHandler = useCallback(
    (postId: string) => {
      const cache = carouselChangeCacheRef.current;
      let fn = cache.get(postId);
      if (!fn) {
        fn = (post: FeedPost, slide: number) => {
          const idx = posts.findIndex((p) => p.id === post.id);
          if (idx >= 0) setCarouselPosition(idx, slide);
        };
        cache.set(postId, fn);
      }
      return fn;
    },
    [posts, setCarouselPosition],
  );

  useEffect(() => {
    const live = new Set(posts.map((p) => p.id));
    const cache = carouselChangeCacheRef.current;
    cache.forEach((_, id) => { if (!live.has(id)) cache.delete(id); });
  }, [posts]);

  const itemContent = useCallback(
    (index: number, post: FeedPost) => {
      const likeState = getLikeState(post);
      const initialSlide = carouselPositions.get(index) ?? 0;
      return (
        <div
          data-card-index={index}
          ref={(el) => {
            const obs = observerRef.current;
            if (el) {
              cardEls.current.set(index, el);
              if (obs) obs.observe(el);
            } else {
              cardEls.current.delete(index);
            }
          }}
        >
          <LightItemGate
            post={post}
            index={index}
            playingIdx={playingIdx}
            activeIdx={activeIdx}
            earlyIdx={earlyIdx}
          >
            {({ isActive, mountVideo, earlyMotion }) => (
              <FeedCard
                post={post}
                liked={!!likeState?.liked}
                likeCount={likeState?.count ?? post.likeCount ?? 0}
                commentCount={getCommentCount(post)}
                onLike={onLike}
                onComment={onComment}
                onShare={onShare}
                onProfile={onProfile}
                onReviewTap={onReviewTap}
                onCourse={onCourse}
                onOpenMedia={handleOpenMedia}
                isActive={isActive}
                mountVideo={mountVideo}
                earlyMotion={earlyMotion}
                initialMediaIndex={initialSlide}
                onCarouselIndexChange={getCarouselChangeHandler(post.id)}
                onFollow={onFollow}
                currentUserId={currentUserId}
                feedIndex={index}
                courseContext={(() => {
                  const cid = resolveCourseId?.(post) ?? post.courseId ?? null;
                  return cid ? courseContextMap?.get(cid) ?? null : null;
                })()}
                postRound={(() => {
                  const sid = postScoreIdMap?.get(post.id) ?? null;
                  return sid ? postRoundMap?.get(sid) ?? null : null;
                })()}
                postRoundPending={(() => {
                  if (postRoundsSettled) return false;
                  const sid = postScoreIdMap?.get(post.id) ?? null;
                  return !!sid && !postRoundMap?.get(sid);
                })()}
                postRoundMissing={(() => {
                  if (!postRoundsSettled) return false;
                  const sid = postScoreIdMap?.get(post.id) ?? null;
                  return !!sid && !postRoundMap?.get(sid);
                })()}
                onRoundTap={onRoundTap}
                commentPreviewEnabled
                commentPreview={commentPreview.map.get(post.id) ?? null}
              />
            )}
          </LightItemGate>
          {/* Inter-card divider — a touch darker than the page bg */}
          <div aria-hidden style={{ height: 5, background: DIVIDER }} />
        </div>
      );
    },
    [
      activeIdx,
      playingIdx,
      earlyIdx,
      carouselPositions,
      getCarouselChangeHandler,
      getCommentCount,
      getLikeState,
      handleOpenMedia,
      onComment,
      onCourse,
      onLike,
      onProfile,
      onReviewTap,
      onShare,
      onFollow,
      currentUserId,
      courseContextMap,
      resolveCourseId,
      postScoreIdMap,
      postRoundMap,
      postRoundsSettled,
      onRoundTap,
      commentPreview.map,
    ],
  );

  const components = useMemo(
    () => ({
      Header: () => <div style={{ height: 0, paddingTop: topPadding }} />,
      Footer: () => <div style={{ height: bottomPadding }} />,
    }),
    [topPadding, bottomPadding],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && onNearEnd) onNearEnd();
  }, [hasNextPage, onNearEnd]);

  return (
    <div style={{ width: '100%', background: PAGE_BG }} data-card-feed="light">
      {scrollParent && (
        <Virtuoso
          customScrollParent={scrollParent}
          data={posts}
          itemContent={itemContent}
          computeItemKey={(_, post) => post.id}
          endReached={handleEndReached}
          defaultItemHeight={950}
          // Symmetric viewport-anchored keep window — see CardFeed for the
          // full rationale. Top was previously 600 (half of bottom), which
          // unmounted playingIdx-1 under sustained down-scroll and starved
          // up-scroll early motion. Matching bottom keeps playingIdx-1 and
          // playingIdx-2 mounted with their paused first frames.
          increaseViewportBy={{ top: 1200, bottom: 1200 }}
          overscan={{ main: 600, reverse: 600 }}
          components={components}
        />
      )}
    </div>
  );

};

LightCardFeed.displayName = 'LightCardFeed';

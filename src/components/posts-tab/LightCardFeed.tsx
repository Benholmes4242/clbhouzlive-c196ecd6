/**
 * LightCardFeed — light-mode, window-scrolled, virtualized profile feed.
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
import { Virtuoso } from 'react-virtuoso';
import type { FeedPost } from '@/components/media-system/types/media';
import type { ActiveActor } from '@/types/actor';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { isPerfEnabled } from '@/perf/navTiming';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { getDocumentScrollParent } from '@/lib/getScrollParent';
import { VideoEngine } from '@/video/VideoEngine';
import { vperfFeedActivateStart, vperfFeedActivateEnd, vperfConsumeEarlyStarted } from '@/perf/vperf';
import { LightFeedCard } from './LightFeedCard';

const PAGE_BG = '#F8FAFC';
const DIVIDER = '#E5E7EA';

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
}) => {
  // ── Active-card tracking (ported from CardFeed) ──
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
    // On this app, #root is the actual scroll container (see ScrollToTopGlass).
    const root = document.getElementById('root');
    setScrollParent(root ?? undefined);
  }, []);



  useEffect(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      setPlayingIdx(activeIdx);
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
      // Signed scroll direction — reused as a directional tie-break in recheckActive.
      const st = readScrollTop();
      const dy = st - lastScrollTopRef.current;
      if (Math.abs(dy) > 0.5) scrollDirRef.current = dy > 0 ? 1 : -1;
      lastScrollTopRef.current = st;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        recheckActive();
      });
    };
    scroller.addEventListener('scroll', onScroll, { passive: true, capture: true } as any);
    return () => {
      scroller.removeEventListener('scroll', onScroll, { capture: true } as any);

      if (raf) cancelAnimationFrame(raf);
    };
  }, [recheckActive]);

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
          >
            {({ isActive, mountVideo }) => (
              <LightFeedCard
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
                initialMediaIndex={initialSlide}
                onCarouselIndexChange={getCarouselChangeHandler(post.id)}
                onFollow={onFollow}
                currentUserId={currentUserId}
                feedIndex={index}
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
          increaseViewportBy={{ top: 600, bottom: 1200 }}
          overscan={{ main: 600, reverse: 600 }}
          components={components}
        />
      )}
    </div>
  );

};

LightCardFeed.displayName = 'LightCardFeed';

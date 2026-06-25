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
import { useClubhouseStore } from '@/store/clubhouseStore';
import { prefetchTile } from '@/hooks/useTileVideoPlayer';
import { LightFeedCard } from './LightFeedCard';

const PAGE_BG = '#F8FAFC';
const DIVIDER = '#E5E7EA';

/** How many neighbours on each side of the active card may mount a <video>. */
const VIDEO_NEIGHBOUR_RADIUS = 1;

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
  topPadding = 0,
  bottomPadding = 32,
  onFollow,
  currentUserId,
}) => {
  // ── Active-card tracking (ported from CardFeed) ──
  const [activeIdx, setActiveIdx] = useState(0);
  const [playingIdx, setPlayingIdx] = useState(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SETTLE_MS = 150;
  const visibilityRef = useRef<Map<number, number>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardEls = useRef<Map<number, HTMLElement>>(new Map());

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
    const viewportCenter = window.innerHeight / 2;
    let bestIdx = -1;
    let bestDist = Infinity;

    visibilityRef.current.forEach((_ratio, idx) => {
      const el = cardEls.current.get(idx);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cardCenter = r.top + r.height / 2;
      const dist = Math.abs(cardCenter - viewportCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });

    if (bestIdx >= 0) {
      setActiveIdx((prev) => {
        if (prev === bestIdx) return prev;
        const prevEl = cardEls.current.get(prev);
        if (prevEl) {
          const pr = prevEl.getBoundingClientRect();
          const prevDist = Math.abs((pr.top + pr.height / 2) - viewportCenter);
          if (prevDist - bestDist < 40) return prev;
        }
        return bestIdx;
      });
    }
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
      { threshold: [0, 0.01, 0.25, 0.5, 0.75, 1.0] },
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
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        recheckActive();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true } as any);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [recheckActive]);

  const setActiveIndex = useClubhouseStore((s) => s.setActiveIndex);
  const setCarouselPosition = useClubhouseStore((s) => s.setCarouselPosition);
  const carouselPositions = useClubhouseStore((s) => s.carouselPositions);
  const openFullscreen = useFullscreenFeedStore((s) => s.open);
  const fsOpen = useFullscreenFeedStore((s) => s.isOpen);

  useEffect(() => {
    setActiveIndex(activeIdx);
  }, [activeIdx, setActiveIndex]);

  useEffect(() => {
    const PREFETCH_AHEAD = 2;
    for (let i = 1; i <= PREFETCH_AHEAD; i++) {
      const next = posts[activeIdx + i];
      if (!next) continue;
      const hlsUrl = next.mediaItems?.[0]?.hlsUrl;
      if (hlsUrl) prefetchTile(hlsUrl);
    }
  }, [activeIdx, posts]);

  useEffect(() => {
    if (!posts?.length) return;
    [0, 1].forEach((i) => {
      const hlsUrl = posts[i]?.mediaItems?.[0]?.hlsUrl;
      if (hlsUrl) prefetchTile(hlsUrl);
    });
  }, [posts?.length]);

  const handleOpenMedia = useCallback(
    (post: FeedPost, mediaIndex: number) => {
      const idx = posts.findIndex((p) => p.id === post.id);
      if (idx < 0) return;
      setActiveIndex(idx);
      if (mediaIndex > 0) setCarouselPosition(idx, mediaIndex);
      openFullscreen(posts, idx);
    },
    [posts, setActiveIndex, setCarouselPosition, openFullscreen],
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
      const isActive = !fsOpen && index === playingIdx;
      const isNear = !fsOpen && Math.abs(index - activeIdx) <= VIDEO_NEIGHBOUR_RADIUS;
      const mountVideo = isNear;
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
          {/* Inter-card divider — a touch darker than the page bg */}
          <div aria-hidden style={{ height: 5, background: DIVIDER }} />
        </div>
      );
    },
    [
      activeIdx,
      playingIdx,
      fsOpen,
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
      <Virtuoso
        useWindowScroll
        data={posts}
        itemContent={itemContent}
        computeItemKey={(_, post) => post.id}
        endReached={handleEndReached}
        increaseViewportBy={{ top: 400, bottom: 1200 }}
        overscan={{ main: 600, reverse: 400 }}
        components={components}
      />
    </div>
  );
};

LightCardFeed.displayName = 'LightCardFeed';

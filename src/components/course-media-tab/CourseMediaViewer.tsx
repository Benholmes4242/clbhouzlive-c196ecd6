/**
 * CourseMediaViewer — Modern fullscreen viewer for course media strips.
 *
 * Read-only viewer that uses the canonical FeedOverlayLayer in readOnly mode.
 * The action rail renders only the creator avatar (tap → profile); like /
 * comment / share / more controls are suppressed. Author identity, course tag
 * pill, and review card all render via the shared system.
 *
 * Powered by its own Zustand store so it never conflicts with FullscreenFeedOverlay.
 * Reached from course detail About tab and Reviews tab media strips.
 */

import React, { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SnapFeed } from '@/components/feed/SnapFeed';
import { FeedOverlayLayer } from '@/components/feed/FeedOverlayLayer';
import { FullscreenCarouselOverlay } from '@/components/media/FullscreenCarouselOverlay';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { pauseAllAudio } from '@/utils/globalVideoMute';
import { getProfilePathById } from '@/lib/profileRoutes';
import type { FeedPost } from '@/components/media-system/types/media';

// ── Dedicated Zustand store ──

interface CourseMediaViewerOpenOptions {
  /** Pagination handoff — opener (typically a strip that owns a paginating
   *  data hook) passes its current pagination signals so the viewer can ask
   *  for more pages as the user nears the end. Optional; surfaces that don't
   *  paginate fall through to `hasNextPage: false` (no behaviour change). */
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

interface CourseMediaViewerState {
  isOpen: boolean;
  posts: FeedPost[];
  startIndex: number;
  activeIndex: number;
  carouselPositions: Map<number, number>;
  hasNextPage: boolean;
  fetchNextPage: (() => void) | null;
  isFetchingNextPage: boolean;
  open: (posts: FeedPost[], startIndex?: number, options?: CourseMediaViewerOpenOptions) => void;
  close: () => void;
  setActiveIndex: (idx: number) => void;
  setCarouselPosition: (feedIdx: number, mediaIdx: number) => void;
  setPaginationState: (state: { hasNextPage: boolean; isFetchingNextPage: boolean }) => void;
}

export const useCourseMediaViewerStore = create<CourseMediaViewerState>((set) => ({
  isOpen: false,
  posts: [],
  startIndex: 0,
  activeIndex: 0,
  carouselPositions: new Map(),
  hasNextPage: false,
  fetchNextPage: null,
  isFetchingNextPage: false,
  open: (posts, startIndex = 0, options) => set({
    isOpen: true,
    posts,
    startIndex,
    activeIndex: startIndex,
    hasNextPage: options?.hasNextPage ?? false,
    fetchNextPage: options?.fetchNextPage ?? null,
    isFetchingNextPage: options?.isFetchingNextPage ?? false,
  }),
  close: () => set({
    isOpen: false,
    posts: [],
    startIndex: 0,
    activeIndex: 0,
    carouselPositions: new Map(),
    hasNextPage: false,
    fetchNextPage: null,
    isFetchingNextPage: false,
  }),
  setActiveIndex: (idx) => set({ activeIndex: idx }),
  setCarouselPosition: (feedIdx, mediaIdx) =>
    set((s) => {
      const next = new Map(s.carouselPositions);
      next.set(feedIdx, mediaIdx);
      return { carouselPositions: next };
    }),
  setPaginationState: ({ hasNextPage, isFetchingNextPage }) =>
    set({ hasNextPage, isFetchingNextPage }),
}));

// ── Component ──

const noop = () => {};

export function CourseMediaViewer() {
  const navigate = useNavigate();
  const {
    isOpen,
    posts,
    startIndex,
    close,
    activeIndex,
    setActiveIndex,
  } = useCourseMediaViewerStore();

  const activePost: FeedPost | null = posts[activeIndex] ?? null;
  const isReview = !!(activePost?.isReview && activePost?.review);

  // Course chip (hidden on review posts to avoid duplication with the review panel)
  const golfCourse = useMemo(() => {
    if (!activePost || isReview) return null;
    if (!activePost.courseId || !activePost.courseName) return null;
    return { id: activePost.courseId, name: activePost.courseName };
  }, [activePost, isReview]);

  // Active review for FeedOverlayLayer
  const activeReview = useMemo(() => {
    if (!activePost?.review) return null;
    return {
      reviewId: activePost.review.reviewId,
      courseId: activePost.review.courseId,
      courseName: activePost.review.courseName,
      courseImageUrl: null,
      rating: activePost.review.rating,
      courseCountry: activePost.review.courseCountry ?? null,
      courseRegion: activePost.review.courseRegion ?? null,
      courseSubCountry: activePost.review.courseSubCountry ?? null,
      reviewText: activePost.review.reviewText ?? null,
    };
  }, [activePost]);

  const handleViewProfile = () => {
    if (!activePost) return;
    close();
    navigate(getProfilePathById(activePost.userId));
  };

  const handleReviewTap = () => {
    if (!activePost?.review) return;
    const review = activePost.review;
    close();
    navigate(`/courses/${review.courseId}?tab=reviews&review=${review.reviewId}`);
  };

  // Body scroll lock + status bar (unchanged behaviour)
  useEffect(() => {
    if (!isOpen) return;
    pauseAllAudio();
    document.body.style.overflow = 'hidden';

    document.body.classList.add('route-fullscreen-overlay');
    const shield = document.getElementById('safe-area-shield');
    if (shield) shield.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = '#000000';
    document.body.style.backgroundColor = '#000000';
    try {
      (window as any).median?.statusbar?.set({ style: 'dark', color: '00000000', overlay: true, blur: false });
    } catch {}

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('route-fullscreen-overlay');
      if (shield) shield.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.style.backgroundColor = 'transparent';
    };
  }, [isOpen]);

  // ESC key
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[9000] bg-black flex flex-col"
        >
          {/* Close — top-left */}
          <button
            onClick={close}
            aria-label="Close"
            className="absolute left-4 z-[9020] flex items-center justify-center active:scale-95 transition-all"
            style={{
              top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
              width: 34,
              height: 34,
              borderRadius: 12,
              background: 'rgba(0, 0, 0, 0.50)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
            }}
          >
            <X className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          </button>

          {posts.length === 0 ? (
            <ClubhouseSkeletonShimmer isVisible={true} isStatic={false} />
          ) : (
            <>
              {/* SnapFeed — drives the actual media playback */}
              <SnapFeed
                posts={posts}
                activeTab="foryou"
                onNearEnd={() => {}}
                onRefresh={async () => {}}
                isRefreshing={false}
                hasNextPage={false}
                followOverrides={new Map()}
                onFollowChange={() => {}}
                startIndex={startIndex}
                onActiveIndexChange={setActiveIndex}
                activeIndexOverride={activeIndex}
                isFullscreen
              />

              {/* Shared overlay system — readOnly hides interactive controls */}
              <FeedOverlayLayer
                posts={posts}
                activeIndexOverride={activeIndex}
                onLike={noop}
                onComment={noop}
                onShare={noop}
                onMore={noop}
                getLikeState={() => ({ isLiked: false, count: 0 })}
                getCommentCount={() => 0}
                getFollowState={() => false}
                onFollow={noop}
                onViewProfile={handleViewProfile}
                onReviewTap={handleReviewTap}
                onBeforeNavigate={close}
                overlayVisible={true}
                isOwnPost={true}
                golfCourse={golfCourse}
                activeReview={activeReview}
                isActiveReview={isReview}
                bottomOffset={0}
                readOnly={true}
              />

              <FullscreenCarouselOverlay
                activePost={activePost}
                activeIndex={activeIndex}
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

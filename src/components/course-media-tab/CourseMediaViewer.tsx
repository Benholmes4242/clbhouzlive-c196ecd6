/**
 * CourseMediaViewer — Modern fullscreen viewer for course media strips.
 *
 * Uses the Breathing Room chrome (ClubhouseTopBar + BreathingRoomBottomBar +
 * BreathingRoomMuteToggle + ReviewHeaderPanel + scrubber) but with all social
 * actions disabled. Reviews render with the dedicated review panel.
 *
 * Powered by its own Zustand store so it never conflicts with FullscreenFeedOverlay.
 * Reached from course detail About tab and Reviews tab media strips.
 */

import React, { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { SnapFeed } from '@/components/feed/SnapFeed';
import { ClubhouseTopBar } from '@/components/clubhouse/ClubhouseTopBar';
import { BreathingRoomBottomBar } from '@/components/feed/BreathingRoomBottomBar';
import { BreathingRoomMuteToggle } from '@/components/feed/BreathingRoomMuteToggle';
import { ReviewHeaderPanel } from '@/components/feed/ReviewHeaderPanel';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { Z } from '@/config/zIndex';
import { formatTimeAgo } from '@/utils/formatTime';
import { pauseAllAudio } from '@/utils/globalVideoMute';
import { getProfilePathById } from '@/lib/profileRoutes';
import type { FeedPost } from '@/components/media-system/types/media';

// ── Dedicated Zustand store ──

interface CourseMediaViewerState {
  isOpen: boolean;
  posts: FeedPost[];
  startIndex: number;
  activeIndex: number;
  carouselPositions: Map<number, number>;
  open: (posts: FeedPost[], startIndex?: number) => void;
  close: () => void;
  setActiveIndex: (idx: number) => void;
  setCarouselPosition: (feedIdx: number, mediaIdx: number) => void;
}

export const useCourseMediaViewerStore = create<CourseMediaViewerState>((set) => ({
  isOpen: false,
  posts: [],
  startIndex: 0,
  activeIndex: 0,
  carouselPositions: new Map(),
  open: (posts, startIndex = 0) => set({ isOpen: true, posts, startIndex, activeIndex: startIndex }),
  close: () => set({ isOpen: false, posts: [], startIndex: 0, activeIndex: 0, carouselPositions: new Map() }),
  setActiveIndex: (idx) => set({ activeIndex: idx }),
  setCarouselPosition: (feedIdx, mediaIdx) =>
    set((s) => {
      const next = new Map(s.carouselPositions);
      next.set(feedIdx, mediaIdx);
      return { carouselPositions: next };
    }),
}));

// ── Component ──

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

  const activeVideoElement = useClubhouseStore((s) => s.activeVideoElement);
  const activePost: FeedPost | null = posts[activeIndex] ?? null;
  const isVideo = activePost?.mediaItems?.[0]?.type === 'video';
  const isReview = !!(activePost?.isReview && activePost?.review);

  // Identity bar author info (mirrors Clubhouse.tsx pattern)
  const activeAuthor = useMemo(() => {
    if (!activePost) return null;
    return {
      id: activePost.userId,
      displayName: activePost.displayName,
      username: activePost.username,
      avatarUrl: activePost.avatarUrl,
      handicapIndex: activePost.handicapIndex ?? null,
      homeClub: activePost.homeClub ?? null,
      timeAgoLabel: activePost.createdAt
        ? formatTimeAgo(activePost.createdAt, 'short')
        : '',
    };
  }, [activePost]);

  // Course chip (hidden on review posts to avoid duplication with the review panel)
  const golfCourse = useMemo(() => {
    if (!activePost || isReview) return null;
    if (!activePost.courseId || !activePost.courseName) return null;
    return { id: activePost.courseId, name: activePost.courseName };
  }, [activePost, isReview]);

  const handleViewProfile = () => {
    if (!activePost) return;
    close();
    navigate(getProfilePathById(activePost.userId));
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

  // No-op stubs for read-only social actions
  const noop = () => {};

  return (
    <>
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
            />

            {/* Top bar — identity only (no tabs / search / profile pill) */}
            {activePost && (
              <ClubhouseTopBar
                activeTab="foryou"
                onTabChange={() => {}}
                isBusinessActor={false}
                user={null}
                hidden={false}
                activeAuthor={activeAuthor}
                onAuthorTap={handleViewProfile}
                hideTabs={true}
                hideProfilePill={true}
                hideSearch={true}
              />
            )}

            {/* Course chip (non-review posts only) */}
            {golfCourse && (
              <motion.button
                type="button"
                onClick={() => {
                  close();
                  navigate(`/courses/${golfCourse.id}`);
                }}
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 132px)',
                  left: 16,
                  zIndex: Z.echo,
                  pointerEvents: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  maxWidth: 'calc(100% - 32px)',
                  padding: '6px 10px',
                  borderRadius: 14,
                  background: 'rgba(0, 0, 0, 0.50)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  cursor: 'pointer',
                  fontFamily: 'Geist, system-ui, sans-serif',
                }}
              >
                <MapPin size={12} stroke="#F7931E" strokeWidth={2.25} />
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: '-0.005em',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {golfCourse.name}
                </span>
              </motion.button>
            )}

            {/* Mute toggle — video posts only */}
            {isVideo && <BreathingRoomMuteToggle isVisible={true} bottomOffset={0} />}

            {/* Review header panel — review posts only */}
            {isReview && activePost?.review && (
              <div
                style={{
                  position: 'fixed',
                  bottom: 140,
                  left: 0,
                  right: 0,
                  zIndex: Z.echo,
                  pointerEvents: 'auto',
                }}
              >
                <ReviewHeaderPanel
                  courseName={activePost.review.courseName}
                  courseImageUrl={activePost.review.courseImageUrl ?? null}
                  courseRegion={activePost.review.courseRegion ?? null}
                  courseCountry={activePost.review.courseCountry ?? null}
                  courseSubCountry={activePost.review.courseSubCountry ?? null}
                  rating={activePost.review.rating}
                  isVisible={true}
                  onTap={() => {
                    if (!activePost.review) return;
                    const review = activePost.review;
                    close();
                    navigate(`/courses/${review.courseId}?tab=reviews&review=${review.reviewId}`);
                  }}
                />
              </div>
            )}

            {/* Bottom bar — read-only caption only (no actions) */}
            {activePost && (
              <BreathingRoomBottomBar
                caption={activePost.caption ?? ''}
                tags={activePost.tags ?? []}
                taggedFriends={[]}
                likesCount={null}
                commentsCount={null}
                hasLiked={false}
                isVisible={true}
                onLike={noop}
                onComment={noop}
                onShare={noop}
                onMore={noop}
                isVideo={!!isVideo}
                isFollowing={false}
                isOwnPost={true}
                onFollow={noop}
                activeVideoElement={activeVideoElement}
                postId={activePost.id}
                readOnly={true}
                bottomOffset={0}
              />
            )}

            {/* Scrubber — rendered separately because readOnly hides the action strip */}
            {isVideo && activeVideoElement && (
              <div
                style={{
                  position: 'fixed',
                  bottom: 56,
                  left: 0,
                  right: 0,
                  pointerEvents: 'auto',
                  zIndex: Z.echo + 1,
                }}
              >
                <VideoScrubber videoEl={activeVideoElement} height={2} variant="amber" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

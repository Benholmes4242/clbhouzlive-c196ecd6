/**
 * CourseMediaViewer — Cinematic fullscreen viewer for About & Reviews tab media.
 * Uses SnapFeed (same engine as Media tab) but strips all social interaction.
 * Powered by its own Zustand store so it never conflicts with FullscreenFeedOverlay.
 */

import React, { useEffect } from 'react';
import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { SnapFeed } from '@/components/feed/SnapFeed';
import { CreatorCapsule } from '@/components/clubhouse/cinematic/CreatorCapsule';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { pauseAllAudio } from '@/utils/globalVideoMute';
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
  const { isOpen, posts, startIndex, close, activeIndex, setActiveIndex, carouselPositions } = useCourseMediaViewerStore();
  const isMuted = useClubhouseStore(s => s.isMuted);
  const toggleMute = useClubhouseStore(s => s.toggleMute);
  const activeVideoElement = useClubhouseStore(s => s.activeVideoElement);

  const activePost = posts[activeIndex] ?? null;
  const isVideo = activePost?.mediaItems?.[0]?.type === 'video';
  const mediaCount = activePost?.mediaItems?.length ?? 0;
  const currentMediaIdx = carouselPositions.get(activeIndex) ?? 0;

  // Body scroll lock + status bar
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
            {/* Close — top left */}
            <button
              onClick={close}
              className="absolute left-4 z-[9010] rounded-full flex items-center justify-center"
              style={{
                top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
                width: 44,
                height: 44,
                background: 'rgba(0, 0, 0, 0.35)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
              }}
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Mute — top right, video only */}
            {isVideo && (
              <button
                onClick={toggleMute}
                className="absolute right-4 z-[9010] rounded-full flex items-center justify-center"
                style={{
                  top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
                  width: 44,
                  height: 44,
                  background: 'rgba(0, 0, 0, 0.35)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                }}
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
              </button>
            )}

            {/* SnapFeed */}
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

            {/* Creator Capsule — no social actions */}
            {activePost && (
              <div style={{ pointerEvents: 'auto' }}>
                <CreatorCapsule
                  user={{
                    id: activePost.userId,
                    name: activePost.displayName,
                    username: activePost.username,
                    avatar: activePost.avatarUrl,
                  }}
                  caption={activePost.caption}
                  tags={activePost.tags}
                  golfCourse={null}
                  isFollowing={false}
                  isOwnPost={false}
                  isVisible={true}
                  onFollow={() => {}}
                  onViewProfile={() => {}}
                  onBeforeNavigate={close}
                  isReview={false}
                  postId={activePost.id}
                  carouselCount={mediaCount}
                  carouselActiveIndex={currentMediaIdx}
                />
              </div>
            )}

            {/* Video Scrubber */}
            {isVideo && activeVideoElement && (
              <div
                style={{
                  position: 'fixed',
                  bottom: 'var(--bottom-nav-height, 88px)',
                  left: 0,
                  right: 0,
                  pointerEvents: 'auto',
                  zIndex: 9011,
                }}
              >
                <VideoScrubber
                  videoEl={activeVideoElement}
                  height={3}
                  variant="fullscreen"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { createMediaStore } from '@/components/media-system/store/createMediaStore';
import { MediaStoreProvider } from '@/components/media-system/store/MediaStoreContext';
import { VideoPoolProvider } from '@/components/media-system/VideoPoolProvider';
import { FeedContainer } from '@/components/media-system/FeedContainer';
import { usePreloader } from '@/components/media-system/hooks/usePreloader';
import { useFullscreenFeed } from './hooks/useFullscreenFeed';
import { FullscreenActionRail } from './FullscreenActionRail';
import { FullscreenCreatorCapsule } from './FullscreenCreatorCapsule';
import { useClubhouseLifecycle } from '@/components/clubhouse/hooks/useClubhouseLifecycle';
import { useVideoAnalytics } from '@/components/media-system/hooks/useVideoAnalytics';
import { useStore } from 'zustand';
import { ChevronLeft } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Scrubber } from '@/components/media-system/Scrubber';

interface FullscreenFeedContentProps {
  posts: FeedPost[];
  startIndex: number;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

/** Wrapper to mount the preloader inside the scoped store context */
function FeedWithPreloader({ posts, children }: { posts: FeedPost[]; children: React.ReactNode }) {
  usePreloader(posts);
  return <>{children}</>;
}

export function FullscreenFeedContent({ posts, startIndex, fetchNextPage, hasNextPage, isFetchingNextPage }: FullscreenFeedContentProps) {
  // Force transparent status bar regardless of which page launched the overlay
  useMedianStatusBar("dark", "transparent", true, false);

  // Create a scoped media store for this overlay instance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => createMediaStore(startIndex), []);

  // Sync active index when fullscreen reopens with a different video
  useEffect(() => {
    store.getState().setActiveIndex(startIndex);
  }, [store, startIndex]);

  const activeIndex = useStore(store, (s) => s.activeIndex);
  const activeVideoElement = useStore(store, (s) => s.activeVideoElement);
  const activeVideoRef = useStore(store, (s) => s.activeVideoRef);
  const activePost = posts[activeIndex];
  const activeDuration = activePost?.mediaItems[0]?.duration ?? null;

  // Lifecycle: visibility pause/resume, network reconnect, wake lock
  useClubhouseLifecycle(() => store.getState());

  // Video analytics: impressions and watch time
  useVideoAnalytics(activePost ?? null, !!activePost, activeVideoElement);

  const handleClose = useCallback(() => {
    useFullscreenFeed.getState().close();
  }, []);

  const handleNearEnd = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Lock body scroll and force black background while overlay is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevBg = document.body.style.background;
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#000';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.background = prevBg;
    };
  }, []);

  // Escape key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  return (
    <MediaStoreProvider store={store}>
      <VideoPoolProvider store={store}>
        <FeedWithPreloader posts={posts}>
          <FeedContainer
            posts={posts}
            initialIndex={startIndex}
            onNearEnd={handleNearEnd}
            hasNextPage={hasNextPage}
          />
        </FeedWithPreloader>
      </VideoPoolProvider>

      {/* Close button — top-left */}
      <button
        onClick={handleClose}
        className="fixed left-4 z-[10000] w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
          background: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
        }}
        aria-label="Close fullscreen"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      {/* Action rail — right side */}
      <FullscreenActionRail posts={posts} store={store} />

      {/* Creator capsule — bottom left */}
      <FullscreenCreatorCapsule posts={posts} store={store} />

      {/* Scrubber — page-level */}
      {activeVideoRef && (
        <Scrubber
          videoRef={activeVideoRef}
          videoElement={activeVideoElement}
          isActive={true}
          duration={activeDuration}
          bottomNavSelector=".fullscreen-feed-bottom-anchor"
          position="fixed"
        />
      )}

      {/* Bottom anchor for scrubber positioning (no bottom nav in fullscreen) */}
      <div
        className="fullscreen-feed-bottom-anchor fixed bottom-0 left-0 right-0"
        style={{ height: 0 }}
      />

      {/* Debug overlays — inside scoped store so they read fullscreen state */}
      <FeedVideoDebugOverlay />
      <ConsoleLogCapture />
    </MediaStoreProvider>
  );
}

import { useMemo, useEffect, useCallback } from 'react';
import { createMediaStore } from '@/components/media-system/store/createMediaStore';
import { MediaStoreProvider } from '@/components/media-system/store/MediaStoreContext';
import { VideoPoolProvider } from '@/components/media-system/VideoPoolProvider';
import { FeedContainer } from '@/components/media-system/FeedContainer';
import { usePreloader } from '@/components/media-system/hooks/usePreloader';
import { useFullscreenFeed } from './hooks/useFullscreenFeed';
import { useStore } from 'zustand';
import { ChevronLeft } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Scrubber } from '@/components/media-system/Scrubber';

interface FullscreenFeedContentProps {
  posts: FeedPost[];
  startIndex: number;
}

/** Wrapper to mount the preloader inside the scoped store context */
function FeedWithPreloader({ posts, children }: { posts: FeedPost[]; children: React.ReactNode }) {
  usePreloader(posts);
  return <>{children}</>;
}

export function FullscreenFeedContent({ posts, startIndex }: FullscreenFeedContentProps) {
  // Create a scoped media store for this overlay instance
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => createMediaStore(startIndex), []);

  const activeIndex = useStore(store, (s) => s.activeIndex);
  const activeVideoElement = useStore(store, (s) => s.activeVideoElement);
  const activeVideoRef = useStore(store, (s) => s.activeVideoRef);
  const activePost = posts[activeIndex];
  const activeDuration = activePost?.mediaItems[0]?.duration ?? null;

  const handleClose = useCallback(() => {
    useFullscreenFeed.getState().close();
  }, []);

  // Lock body scroll while overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
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
          />
        </FeedWithPreloader>
      </VideoPoolProvider>

      {/* Close button — top-left */}
      <button
        onClick={handleClose}
        className="fixed top-[env(safe-area-inset-top,12px)] left-3 z-[10000] w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          marginTop: 12,
        }}
        aria-label="Close fullscreen"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

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
    </MediaStoreProvider>
  );
}

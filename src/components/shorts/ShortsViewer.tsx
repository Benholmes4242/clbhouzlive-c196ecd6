import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import { X, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import { ExploreContentItem } from '@/components/explore/types';
import { useSwipeable } from 'react-swipeable';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { OverlayCorners, OVERLAY_TOP_LEFT, OVERLAY_TOP_RIGHT } from '@/components/shared/overlay';
import { cn } from '@/lib/utils';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';

interface ShortsViewerProps {
  items: ExploreContentItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortsViewer({ items, initialIndex, isOpen, onClose }: ShortsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resolvedDuration, setResolvedDuration] = useState<number | undefined>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>();
  
  const currentItem = items[currentIndex];
  const videoId = `shorts-viewer-${currentItem?.id}`;
  const { isMuted, toggleMute } = useExclusiveVideoAudio(videoId);

  // Navigation
  const goToNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCaptionExpanded(false);
      setProgress(0);
      setResolvedDuration(undefined);
    }
  }, [currentIndex, items.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCaptionExpanded(false);
      setProgress(0);
      setResolvedDuration(undefined);
    }
  }, [currentIndex]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedUp: goToNext,
    onSwipedDown: goToPrevious,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: true
  });

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowUp':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowDown':
          e.preventDefault();
          goToNext();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToNext, goToPrevious, toggleMute]);

  // Video playback & progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isOpen) return;

    video.muted = isMuted;
    video.loop = true;
    video.playsInline = true;

    MediaRuntime.requestPlay({ id: videoId, surface: 'fullscreen', reason: 'user' });

    const updateProgress = () => {
      if (video.duration > 0) {
        setProgress((video.currentTime / video.duration) * 100);
      }
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    rafRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // CLEANUP_PAUSE: Stop playback when component unmounts
      MediaRuntime.requestPause({ id: videoId, reason: 'visibility' });
    };
  }, [currentIndex, isOpen, isMuted]);

  // Reset on index change
  useEffect(() => {
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [currentIndex]);

  // Get duration from video element or item data
  useEffect(() => {
    if (currentItem?.durationSeconds && currentItem.durationSeconds > 0) {
      setResolvedDuration(currentItem.durationSeconds);
    }
  }, [currentItem?.durationSeconds]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && !resolvedDuration) {
      const d = video.duration;
      if (Number.isFinite(d) && d > 0 && d !== Infinity) {
        setResolvedDuration(d);
      }
    }
  };

  // Preload adjacent videos
  useEffect(() => {
    if (!isOpen) return;

    const preloadUrls = [
      items[currentIndex - 1]?.src,
      items[currentIndex + 1]?.src
    ].filter(Boolean);

    preloadUrls.forEach(url => {
      if (url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
      }
    });
  }, [currentIndex, isOpen, items]);

  if (!isOpen || !currentItem) return null;

  // Build club data if golf course exists
  const clubData = currentItem.golfCourse ? {
    id: currentItem.golfCourse.id,
    name: currentItem.golfCourse.name,
  } : null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black"
      {...swipeHandlers}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={currentItem.src}
        className="absolute inset-0 h-full w-full object-contain"
        playsInline
        autoPlay
        loop
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Close Button - Top Left (before ranking pill) */}
      <button
        onClick={onClose}
        className="absolute left-4 z-50 w-10 h-10 rounded-full backdrop-blur-md bg-black/35 border border-white/10 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        style={{ top: "calc(env(safe-area-inset-top, 20px) + 12px)" }}
        aria-label="Close viewer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Unified overlay system (uses player surface) */}
      {/* Offset left/right to account for close and mute buttons */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Custom positioning for player to avoid button overlap */}
        <OverlayCorners
          surface="player"
          isPopular={(currentItem as any).isPopular}
          isTrending={(currentItem as any).isTrending}
          club={clubData}
          durationSeconds={resolvedDuration}
          showCreator={false}
          showLikes={false}
          showAvatar={false}
        />
      </div>

      {/* Mute Toggle - Top Right */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full backdrop-blur-md bg-black/35 border border-white/10 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Navigation Hints */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[200px] z-40 w-10 h-10 rounded-full backdrop-blur-md bg-black/35 border border-white/10 flex items-center justify-center text-white opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Previous short"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}

      {currentIndex < items.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[200px] z-40 w-10 h-10 rounded-full backdrop-blur-md bg-black/35 border border-white/10 flex items-center justify-center text-white opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Next short"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      )}

      {/* Caption Panel - Bottom */}
      <button
        onClick={() => setCaptionExpanded(!captionExpanded)}
        className={`absolute bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-black/35 border-t border-white/10 px-4 transition-all duration-200 text-left ${
          captionExpanded ? 'py-6 max-h-[50vh] overflow-y-auto' : 'py-4 max-h-[100px]'
        }`}
      >
        {/* Title */}
        <h2 className={`text-white font-semibold text-base ${captionExpanded ? '' : 'line-clamp-2'}`}>
          {currentItem.title || 'Untitled'}
        </h2>

        {/* Meta Row */}
        <div className="flex items-center gap-2 mt-1 text-sm text-white/80">
          <span className="font-medium">{currentItem.user?.name || 'Unknown'}</span>
          {currentItem.likes !== undefined && (
            <>
              <span>•</span>
              <span>{currentItem.likes.toLocaleString()} likes</span>
            </>
          )}
        </div>

        {/* Expanded Content */}
        {captionExpanded && currentItem.ctaDescription && (
          <p className="mt-3 text-sm text-white/70 leading-relaxed">
            {currentItem.ctaDescription}
          </p>
        )}
      </button>

      {/* Progress Bar - Very Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-50">
        <div
          className="h-full bg-white transition-transform origin-left"
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>
    </div>
  );
}

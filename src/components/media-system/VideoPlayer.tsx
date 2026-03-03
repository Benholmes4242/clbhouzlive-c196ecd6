/**
 * VideoPlayer — requests a pool element, handles playing/error/loop lifecycle.
 * Uses 'playing' event for skeleton transition (not canplay/loadeddata).
 * Integrates gapless loop hook for seamless looping.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useVideoPoolContext } from './VideoPoolProvider';
import { useMediaStore } from './store/mediaStore';
import { useGaplessLoop } from './hooks/useGaplessLoop';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorState } from './ErrorState';
import { Scrubber } from './Scrubber';
import { Play, Pause } from 'lucide-react';

const MAX_RETRIES = 3;

interface VideoPlayerProps {
  hlsUrl: string;
  feedIndex: number;
  isActive: boolean;
  thumbnailUrl?: string;
  duration?: number;
}

export function VideoPlayer({ hlsUrl, feedIndex, isActive, thumbnailUrl, duration: mediaDuration }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const retryCountRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(mediaDuration ?? null);
  const pool = useVideoPoolContext();
  const isMuted = useMediaStore((s) => s.isMuted);

  // Gapless loop
  useGaplessLoop(videoRef, isActive && !isLoading && !hasError, videoDuration);

  // Assign/release pool element
  useEffect(() => {
    if (!isActive || !containerRef.current) {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      setIsLoading(true);
      setHasError(false);
      videoRef.current = null;
      return;
    }

    // Reset retry count on fresh activation
    retryCountRef.current = 0;

    let cancelled = false;

    const activate = async () => {
      const container = containerRef.current;
      if (!container || cancelled) return;

      setIsLoading(true);
      setHasError(false);

      const video = await pool.assign(
        hlsUrl,
        feedIndex,
        container,
        // onPlaying callback — skeleton crossfade
        () => {
          if (cancelled) return;
          setIsLoading(false);
          setIsPlaying(true);
          if (video && video.duration && isFinite(video.duration)) {
            setVideoDuration(video.duration);
          }
        },
        // onError callback
        () => {
          if (cancelled) return;
          setIsLoading(false);
          setHasError(true);
          useMediaStore.getState().markError(feedIndex);
        }
      );

      if (cancelled || !video) return;
      videoRef.current = video;
      video.muted = isMuted;

      // If already playing (cache hit), update state
      if (!video.paused && video.readyState >= 3) {
        setIsLoading(false);
        setIsPlaying(true);
        if (video.duration && isFinite(video.duration)) {
          setVideoDuration(video.duration);
        }
      }
    };

    activate();

    return () => {
      cancelled = true;
    };
  }, [isActive, hlsUrl, feedIndex, pool]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current && isActive) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, isActive]);

  // Retry handler with max limit
  const handleRetry = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES) {
      // Give up — show permanent error state
      return;
    }
    retryCountRef.current += 1;

    setHasError(false);
    setIsLoading(true);
    useMediaStore.getState().clearError(feedIndex);
    useMediaStore.getState().markRetrying(feedIndex);

    const container = containerRef.current;
    if (!container) return;

    pool.assign(
      hlsUrl,
      feedIndex,
      container,
      () => {
        setIsLoading(false);
        setIsPlaying(true);
        useMediaStore.getState().clearRetrying(feedIndex);
        if (videoRef.current?.duration && isFinite(videoRef.current.duration)) {
          setVideoDuration(videoRef.current.duration);
        }
      },
      () => {
        setIsLoading(false);
        setHasError(true);
        useMediaStore.getState().clearRetrying(feedIndex);
        useMediaStore.getState().markError(feedIndex);
      }
    ).then((video) => {
      if (video) {
        videoRef.current = video;
        video.muted = useMediaStore.getState().isMuted;
      }
    });
  }, [hlsUrl, feedIndex, pool]);

  // Tap to toggle play/pause
  const handleTap = useCallback(() => {
    if (hasError) return;
    const video = videoRef.current;
    if (!video || !isActive) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }

    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 800);
  }, [isActive, hasError]);

  const canRetry = retryCountRef.current < MAX_RETRIES;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onClick={handleTap}
    >
      {/* Poster-first loading: show thumbnail as background while loading */}
      <LoadingSkeleton
        visible={isLoading && !hasError}
        posterUrl={thumbnailUrl}
      />

      {/* Error state */}
      {hasError && <ErrorState onRetry={handleRetry} canRetry={canRetry} />}

      {/* Play/Pause overlay */}
      {showPlayIcon && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              animation: 'media-play-fade 0.8s ease-out forwards',
            }}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" fill="white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
            )}
          </div>
          <style>{`
            @keyframes media-play-fade {
              0% { opacity: 0; transform: scale(0.5); }
              20% { opacity: 1; transform: scale(1); }
              80% { opacity: 1; transform: scale(1); }
              100% { opacity: 0; transform: scale(0.8); }
            }
          `}</style>
        </div>
      )}

      {/* Scrubber */}
      <Scrubber videoElement={isActive && !hasError ? videoRef.current : null} />
    </div>
  );
}

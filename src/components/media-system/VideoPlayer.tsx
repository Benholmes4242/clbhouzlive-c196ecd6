/**
 * VideoPlayer — requests a pool element, handles playing/error/loop lifecycle.
 * Uses 'playing' event for skeleton transition (not canplay/loadeddata).
 * Integrates gapless loop hook for seamless looping.
 * Supports double-tap-to-like, interactive scrubber, and MP4 fallback.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useVideoPoolContext } from './VideoPoolProvider';
import { useMediaStore } from './store/mediaStore';
import { useGaplessLoop } from './hooks/useGaplessLoop';
import { getHlsInstance } from './utils/hlsManager';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorState } from './ErrorState';
import { Scrubber } from './Scrubber';
import { Play, Pause, Heart } from 'lucide-react';
import { haptic } from '@/utils/haptics';

const MAX_RETRIES = 3;
const DOUBLE_TAP_DELAY = 300;

interface VideoPlayerProps {
  hlsUrl: string;
  feedIndex: number;
  isActive: boolean;
  thumbnailUrl?: string;
  duration?: number;
  mp4Url?: string;
  onDoubleTapLike?: () => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
}

export function VideoPlayer({
  hlsUrl, feedIndex, isActive, thumbnailUrl, duration: mediaDuration,
  mp4Url, onDoubleTapLike, onScrubStart, onScrubEnd,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const retryCountRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(mediaDuration ?? null);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const pool = useVideoPoolContext();
  const isMuted = useMediaStore((s) => s.isMuted);

  // Double-tap detection
  const tapTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const tapCountRef = useRef(0);

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

    retryCountRef.current = 0;
    useMediaStore.getState().setUserPaused(false);
    let cancelled = false;

    const activate = async () => {
      const container = containerRef.current;
      if (!container || cancelled) return;

      setIsLoading(true);
      setHasError(false);

      const video = await pool.assign(
        hlsUrl, feedIndex, container,
        () => {
          if (cancelled) return;
          setIsLoading(false);
          setIsPlaying(true);
          if (video && video.duration && isFinite(video.duration)) {
            setVideoDuration(video.duration);
          }
        },
        () => {
          if (cancelled) return;
          setIsLoading(false);
          setHasError(true);
          useMediaStore.getState().markError(feedIndex);
        },
        mp4Url
      );

      if (cancelled || !video) return;
      videoRef.current = video;
      video.muted = isMuted;

      if (!video.paused && video.readyState >= 3) {
        setIsLoading(false);
        setIsPlaying(true);
        if (video.duration && isFinite(video.duration)) {
          setVideoDuration(video.duration);
        }
      }
    };

    activate();
    return () => { cancelled = true; };
  }, [isActive, hlsUrl, feedIndex, pool, mp4Url]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current && isActive) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, isActive]);

  // Retry handler
  const handleRetry = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES) return;
    retryCountRef.current += 1;

    setHasError(false);
    setIsLoading(true);
    useMediaStore.getState().clearError(feedIndex);
    useMediaStore.getState().markRetrying(feedIndex);

    const container = containerRef.current;
    if (!container) return;

    pool.assign(hlsUrl, feedIndex, container,
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
      },
      mp4Url
    ).then((video) => {
      if (video) {
        videoRef.current = video;
        video.muted = useMediaStore.getState().isMuted;
      }
    });
  }, [hlsUrl, feedIndex, pool, mp4Url]);

  // Double-tap aware tap handler
  const handleTap = useCallback(() => {
    if (hasError) return;
    const video = videoRef.current;
    if (!video || !isActive) return;

    tapCountRef.current += 1;

    if (tapCountRef.current === 1) {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
        if (video.paused) {
          video.play().catch(() => {});
          setIsPlaying(true);
          useMediaStore.getState().setUserPaused(false);
        } else {
          video.pause();
          setIsPlaying(false);
          useMediaStore.getState().setUserPaused(true);
        }
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 800);
      }, DOUBLE_TAP_DELAY);
    } else if (tapCountRef.current >= 2) {
      clearTimeout(tapTimerRef.current);
      tapCountRef.current = 0;
      setShowDoubleTapHeart(true);
      setTimeout(() => setShowDoubleTapHeart(false), 900);
      haptic('medium');
      onDoubleTapLike?.();
    }
  }, [isActive, hasError, onDoubleTapLike]);

  // Cleanup tap timer
  useEffect(() => () => { clearTimeout(tapTimerRef.current); }, []);

  // ── Quality transition masking (HLS level upgrades) ──
  useEffect(() => {
    if (!isActive || !videoRef.current) return;
    const hls = getHlsInstance(videoRef.current);
    if (!hls) return;

    const video = videoRef.current;

    const onLevelSwitching = (_event: unknown, data: any) => {
      if (!video || !hls.levels) return;
      const newLevel = data.level;
      const currentLevel = hls.currentLevel;
      // Only mask quality UPGRADES
      if (newLevel > currentLevel) {
        video.style.filter = 'blur(1.5px)';
        video.style.transition = 'filter 150ms ease-out';
      }
    };

    const onLevelSwitched = () => {
      if (!video) return;
      video.style.filter = 'none';
      video.style.transition = 'filter 300ms ease-in';
    };

    // Use string event names to avoid needing the Hls constructor
    (hls as any).on('hlsLevelSwitching', onLevelSwitching);
    (hls as any).on('hlsLevelSwitched', onLevelSwitched);

    return () => {
      (hls as any).off('hlsLevelSwitching', onLevelSwitching);
      (hls as any).off('hlsLevelSwitched', onLevelSwitched);
      if (video) {
        video.style.filter = '';
        video.style.transition = '';
      }
    };
  }, [isActive]);

  const canRetry = retryCountRef.current < MAX_RETRIES;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onClick={handleTap}
    >
      <LoadingSkeleton visible={isLoading && !hasError} posterUrl={thumbnailUrl} />

      {hasError && <ErrorState onRetry={handleRetry} canRetry={canRetry} />}

      {/* Play/Pause overlay */}
      {showPlayIcon && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.45)',
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
        </div>
      )}

      {/* Double-tap heart animation */}
      {showDoubleTapHeart && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <Heart
            className="text-white"
            style={{
              width: 80,
              height: 80,
              animation: 'double-tap-heart 0.9s ease-out forwards',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
            }}
          />
        </div>
      )}

      {/* Scrubber */}
      <Scrubber
        videoRef={videoRef}
        isActive={isActive && !hasError}
        duration={videoDuration}
        onScrubStart={onScrubStart}
        onScrubEnd={onScrubEnd}
      />
    </div>
  );
}

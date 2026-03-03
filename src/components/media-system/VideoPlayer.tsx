/**
 * VideoPlayer — requests a pool element, positions it, handles canplay.
 * Shows LoadingSkeleton until video is ready to play.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useVideoPoolContext } from './VideoPoolProvider';
import { useMediaStore } from './store/mediaStore';
import { LoadingSkeleton } from './LoadingSkeleton';
import { Scrubber } from './Scrubber';
import { Play, Pause } from 'lucide-react';

interface VideoPlayerProps {
  hlsUrl: string;
  feedIndex: number;
  isActive: boolean;
  thumbnailUrl?: string;
}

export function VideoPlayer({ hlsUrl, feedIndex, isActive, thumbnailUrl }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const pool = useVideoPoolContext();
  const isMuted = useMediaStore((s) => s.isMuted);

  // Assign/release pool element based on active state
  useEffect(() => {
    if (!isActive || !containerRef.current) {
      // Pause if we have a video ref
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      // Reset loading state so skeleton is ready for re-activation
      setIsLoading(true);
      videoRef.current = null;
      return;
    }

    let cancelled = false;

    const activate = async () => {
      const container = containerRef.current;
      if (!container || cancelled) return;

      setIsLoading(true);
      const video = await pool.assign(hlsUrl, feedIndex, container);
      if (cancelled || !video) return;

      videoRef.current = video;
      video.muted = isMuted;

      const onReady = () => {
        if (cancelled) return;
        setIsLoading(false);
        video.play().then(() => {
          if (!cancelled) setIsPlaying(true);
        }).catch(() => {});
      };

      // Looping: when video ends, reset to start and replay
      const onEnded = () => {
        if (cancelled) return;
        video.currentTime = 0;
        video.play().catch(() => {});
      };

      // Listen for both canplay and loadeddata as fallbacks
      const onCanPlay = () => {
        video.removeEventListener('loadeddata', onLoadedData);
        clearTimeout(safetyTimeout);
        onReady();
      };

      const onLoadedData = () => {
        video.removeEventListener('canplay', onCanPlay);
        clearTimeout(safetyTimeout);
        onReady();
      };

      // Safety timeout: if neither event fires within 5s, force reveal
      const safetyTimeout = setTimeout(() => {
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('loadeddata', onLoadedData);
        onReady();
      }, 5000);

      video.addEventListener('ended', onEnded);

      // Check if already ready (cache hit — element may already have data loaded)
      if (video.readyState >= 3) {
        clearTimeout(safetyTimeout);
        onReady();
      } else {
        video.addEventListener('canplay', onCanPlay, { once: true });
        video.addEventListener('loadeddata', onLoadedData, { once: true });
      }

      // Cleanup function to remove all listeners on deactivation
      return () => {
        video.removeEventListener('ended', onEnded);
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('loadeddata', onLoadedData);
        clearTimeout(safetyTimeout);
      };
    };

    let cleanupListeners: (() => void) | undefined;
    activate().then((cleanup) => {
      cleanupListeners = cleanup;
    });

    return () => {
      cancelled = true;
      cleanupListeners?.();
    };
  }, [isActive, hlsUrl, feedIndex, pool]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current && isActive) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, isActive]);

  // Tap to toggle play/pause
  const handleTap = useCallback(() => {
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
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onClick={handleTap}
    >
      {/* Poster image while loading */}
      {thumbnailUrl && isLoading && (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-[5]"
          draggable={false}
        />
      )}

      {/* Shimmer skeleton */}
      <LoadingSkeleton visible={isLoading} />

      {/* Play/Pause overlay */}
      {showPlayIcon && (
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
      <Scrubber videoElement={isActive ? videoRef.current : null} />
    </div>
  );
}

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSheetPlayback } from './SheetPlaybackContext';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';

// Debug flag declaration
declare global {
  interface Window {
    __DEBUG_SHEET__?: boolean;
  }
}

interface VideoThumbPlayerProps {
  url: string;
  poster?: string;
  ioRoot?: Element | null;
  className?: string;
}

// Extract Cloudflare Stream UID from URL for poster generation
function extractStreamUid(url: string): string | null {
  const match = /\/([a-z0-9-]{16,})\/manifest\/video\.m3u8/i.exec(url);
  return match?.[1] ?? null;
}

export const VideoThumbPlayer: React.FC<VideoThumbPlayerProps> = ({
  url,
  poster,
  ioRoot,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const { register, requestPlay, requestUnmute } = useSheetPlayback();
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  const id = React.useId();
  
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);

  // Generate poster from Cloudflare Stream URL if not provided
  const streamUid = extractStreamUid(url);
  const resolvedPoster = poster || (streamUid ? generateThumbnailUrl(streamUid, { width: 400, height: 400, time: 1 }) : undefined);

  // Register with exclusive playback controller
  useEffect(() => {
    const pauseFn = () => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };

    const muteFn = () => {
      if (videoRef.current) {
        videoRef.current.muted = true;
      }
    };

    return register(id, pauseFn, muteFn);
  }, [id, register, url, isGloballyMuted]);

  // Setup video source and HLS if needed
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const needsHls = url.endsWith('.m3u8') && !video.canPlayType('application/vnd.apple.mpegurl');
    let mounted = true;

    const setupVideo = async () => {
      try {
        if (!needsHls) {
          video.src = url;
          return;
        }

        const { default: Hls } = await import('hls.js/dist/hls.light.min.js');
        if (!mounted) return;

        if (Hls.isSupported()) {
          const hls = new Hls({
            maxBufferLength: 10,
            maxMaxBufferLength: 20,
          });
          
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
              setError(true);
            }
          });
        } else {
          video.src = url;
        }
      } catch (err) {
        console.error('Error setting up video:', err);
        setError(true);
      }
    };

    setupVideo();

    return () => {
      mounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

  // Intersection Observer for auto-pause when out of view
  useEffect(() => {
    if (!ioRoot || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      },
      {
        root: ioRoot,
        threshold: 0.25,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [ioRoot]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      if (hasUserInteracted) setLoading(true);
    };
    const handleCanPlay = () => {
      setLoading(false);
      setHasFirstFrame(true);
    };
    const handlePlay = () => {
      setPlaying(true);
    };
    const handlePause = () => {
      setPlaying(false);
    };
    const handleError = () => {
      setError(true);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime !== undefined) {
        const progressPercent = (video.currentTime / video.duration) * 100;
        setProgress(progressPercent);
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0 && video.duration) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / video.duration) * 100;
        setBuffered(bufferedPercent);
      }
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
    };
  }, [id, isGloballyMuted]);

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video || error) return;

    setHasUserInteracted(true);
    if (video.paused) {
      requestPlay(id);
      MediaRuntime.requestPlay({ id, surface: 'grid', reason: 'user' });
    } else {
      MediaRuntime.requestPause({ id, reason: 'user' });
    }
  }, [id, requestPlay, error]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleGlobalMute();
    // Immediately sync to video element
    if (videoRef.current) {
      videoRef.current.muted = !isGloballyMuted;
    }
  }, [toggleGlobalMute, isGloballyMuted]);

  // Sync global mute state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isGloballyMuted;
    }
  }, [isGloballyMuted]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePlayPause();
    }
  }, [togglePlayPause]);

  // TODO: Migrate to UnifiedVideoPlayer in a dedicated media-player standardisation pass
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden rounded-[inherit] cursor-pointer",
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={playing ? 'Pause video' : 'Play video'}
      onClick={togglePlayPause}
      onKeyDown={handleKeyDown}
    >
      {/* Shimmer while loading */}
      {!posterLoaded && !hasFirstFrame && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Poster thumbnail - visible until video plays */}
      {resolvedPoster && !playing && (
        <img
          src={resolvedPoster}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-150",
            posterLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setPosterLoaded(true)}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      <video
        ref={videoRef}
        muted={isGloballyMuted}
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
        style={{ backgroundColor: 'transparent' }}
        poster={resolvedPoster}
      />

      {/* Center Play/Pause Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={cn(
            "glass-dark w-10 h-10 rounded-full flex items-center justify-center transition-opacity duration-200",
            playing && !loading && !error ? "opacity-0" : "opacity-100"
          )}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : error ? (
            <span className="text-white text-xs">⚠︎</span>
          ) : playing ? (
            <Pause className="w-5 h-5 text-white" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
          )}
        </div>
      </div>

      {/* Mute Toggle - Top Right with Glass Dark */}
      <button
        onClick={handleMuteToggle}
        className="glass-dark absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
        aria-pressed={!isGloballyMuted}
        aria-label={isGloballyMuted ? 'Unmute video' : 'Mute video'}
      >
        {isGloballyMuted ? (
          <VolumeX className="w-3.5 h-3.5 text-white/80" />
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-white/80" />
        )}
      </button>

      {/* Progress Bar */}
      {!error && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="absolute top-0 left-0 h-full bg-white/20 transition-all duration-200 ease-linear"
            style={{ width: `${Math.min(100, Math.max(0, buffered))}%` }}
          />
          <div
            className="absolute top-0 left-0 h-full bg-white/60 transition-all duration-150 ease-linear"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {/* Error State Overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-center text-white/70">
            <div className="text-lg mb-1">⚠︎</div>
            <div className="text-xs">Failed to load</div>
          </div>
        </div>
      )}

      {/* Live region for screen readers */}
      <div className="sr-only" aria-live="polite">
        {playing ? (isGloballyMuted ? 'Playing, muted' : 'Playing') : 'Paused'}
      </div>
    </div>
  );
};

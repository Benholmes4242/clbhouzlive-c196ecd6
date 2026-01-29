import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, X } from 'lucide-react';
import { useLongPress } from '@/hooks/useLongPress';
import { useCappedLoading } from '@/hooks/useCappedLoading';
import { haptic } from '@/utils/haptics';
import { useToast } from '@/hooks/use-toast';
import { getFilterClass } from '@/utils/studioFilters';
import { cn } from '@/lib/utils';
import { buildImageThumbnailUrl, buildVideoPosterUrl } from '@/utils/mediaThumbs';
import { StudioEdits } from '@/types/studio';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { HLSPlayer, HLSPlayerRef } from '@/media';

// Helper to detect if URL requires HLS player
const isHlsUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('.m3u8') || 
         url.includes('cloudflarestream.com') || 
         url.includes('videodelivery.net');
};

interface CarouselSlideProps {
  item: {
    id: string;
    type: 'image' | 'video';
    previewUrl?: string;
    url?: string;
    file?: File;
    thumbnailUrl?: string;
    alt?: string;
  };
  index?: number;
  isActive: boolean;
  onVideoRef?: (ref: HTMLVideoElement | null) => void;
  onSetCover?: (index: number) => void;
  coverIndex?: number;
  /** Force video to be muted (e.g., when music track is active) */
  forceVideoMuted?: boolean;
  /** Callback when user attempts to unmute while music is active */
  onMuteBlocked?: () => void;
  /** Full studio edits for this media */
  studioEdits?: StudioEdits;
  /** Hide video overlays (VIDEO badge and center play icon) - used in create moment */
  hideVideoOverlays?: boolean;
  /** Object fit mode: 'cover' crops to fill, 'contain' shows full media */
  objectFit?: 'cover' | 'contain';
  /** Callback when media dimensions are loaded */
  onDimensionsLoaded?: (id: string, width: number, height: number) => void;
}

export default function CarouselSlide({ 
  item, 
  index = 0, 
  isActive, 
  onVideoRef, 
  onSetCover, 
  coverIndex = 0,
  forceVideoMuted = false,
  onMuteBlocked,
  studioEdits,
  hideVideoOverlays = false,
  objectFit = 'cover',
  onDimensionsLoaded,
}: CarouselSlideProps) {
  const [loaded, setLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [generatedPosterUrl, setGeneratedPosterUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsPlayerRef = useRef<HLSPlayerRef>(null);
  const objectUrlRef = useRef<string | null>(null);
  const { toast } = useToast();
  
  const showSkeleton = useCappedLoading(loaded, 600);
  const filterClass = getFilterClass(studioEdits?.filter);
  const cropClass = getCropWrapperClass(studioEdits?.crop);
  const pixelStyle = getPixelLayerStyle(studioEdits);
  
  const longPressProps = useLongPress(() => {
    onSetCover?.(index);
    toast({ description: 'Cover set' });
    haptic('light');
  });

  // Create a stable object URL only if needed (avoid recreating blob URLs on re-render)
  useEffect(() => {
    if (!item.file) return;
    if (item.previewUrl || item.url) return;

    const url = URL.createObjectURL(item.file);
    objectUrlRef.current = url;

    return () => {
      URL.revokeObjectURL(url);
      objectUrlRef.current = null;
    };
  }, [item.file, item.previewUrl, item.url]);

  // Generate base URL for media
  // IMPORTANT: For videos, a poster image is required for a non-playing preview;
  // the video element often renders "blank" when preload is metadata.
  const baseUrl = item.previewUrl || item.url || objectUrlRef.current || '';

  // If this is a local (blob) video and we don't have a real thumbnail image,
  // generate a poster from the first frame (same approach as MediaThumbnailStrip).
  useEffect(() => {
    if (item.type !== 'video') return;
    if (!baseUrl || !baseUrl.startsWith('blob:')) return;

    // If a distinct thumbnail was already provided, don't generate.
    if (item.thumbnailUrl && item.thumbnailUrl !== baseUrl) return;

    let cancelled = false;
    setGeneratedPosterUrl(null);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      try {
        const dur = Number.isFinite(video.duration) ? video.duration : 0;
        // Seek slightly in to ensure a drawable frame (clamp for very short clips)
        const seekTo = dur > 0 ? Math.min(0.1, Math.max(0.01, dur * 0.05)) : 0.1;
        video.currentTime = seekTo;
      } catch {
        // ignore
      }
    };

    video.onseeked = () => {
      if (cancelled) return;
      try {
        const size = 600;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx || !video.videoWidth || !video.videoHeight) return;

        // Cover-crop into a square
        const scale = Math.max(size / video.videoWidth, size / video.videoHeight);
        const sw = size / scale;
        const sh = size / scale;
        const sx = (video.videoWidth - sw) / 2;
        const sy = (video.videoHeight - sh) / 2;

        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, size, size);
        setGeneratedPosterUrl(canvas.toDataURL('image/jpeg', 0.75));
      } catch {
        // ignore
      }
    };

    video.src = baseUrl;
    video.load();

    return () => {
      cancelled = true;
      video.src = '';
    };
  }, [item.type, item.thumbnailUrl, baseUrl]);

  // Use thumbnail URLs for poster images
  const posterUrl = item.type === 'video'
    ? (
        // Prefer generated thumbnail (from normalizeFilesToMediaItems / generateVideoPoster)
        item.thumbnailUrl && item.thumbnailUrl !== baseUrl
          ? item.thumbnailUrl
          : (!baseUrl.startsWith('blob:') ? buildVideoPosterUrl(baseUrl, { width: 600, height: 600 }) : undefined)
      )
    : buildImageThumbnailUrl(baseUrl, { width: 600, height: 600 });

  const resolvedPosterUrl = item.type === 'video'
    ? (posterUrl || generatedPosterUrl || undefined)
    : posterUrl;

  // Debug logging for video rendering issues
  if (item.type === 'video') {
    console.log('[CarouselSlide] Rendering item:', {
      type: item.type,
      hasFile: !!item.file,
      previewUrl: item.previewUrl,
      baseUrl: baseUrl,
      thumbnailUrl: item.thumbnailUrl,
      usingThumbnailPoster: !!(item.thumbnailUrl && item.thumbnailUrl !== baseUrl),
    });
  }

  useEffect(() => {
    if (videoRef.current && onVideoRef) {
      onVideoRef(videoRef.current);
    }
    return () => {
      if (onVideoRef) onVideoRef(null);
    };
  }, [onVideoRef]);

  // Pause video when slide becomes inactive - handles both HLS player and native video
  useEffect(() => {
    if (!isActive) {
      // Try HLS player first
      const hlsPlayer = hlsPlayerRef.current;
      if (hlsPlayer) {
        const videoEl = hlsPlayer.getElement();
        if (videoEl && !videoEl.paused) {
          hlsPlayer.pause();
          setIsPlaying(false);
        }
      }
      // Also check native video
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  // Format duration/time as countdown
  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause on tap - works for both HLS player and native video
  const handleVideoTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    haptic('light');
    
    // Try HLS player first
    const hlsPlayer = hlsPlayerRef.current;
    if (hlsPlayer) {
      const videoEl = hlsPlayer.getElement();
      if (videoEl) {
        if (videoEl.paused) {
          hlsPlayer.play().catch(console.error);
        } else {
          hlsPlayer.pause();
        }
        return;
      }
    }
    
    // Fallback to native video
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, []);

  // Handle video time update for countdown
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
    }
  }, []);

  // Handle video metadata load
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      setLoaded(true);
    }
  }, []);

  // Calculate remaining time for countdown
  const remainingTime = Math.max(0, duration - currentTime);

  // Determine if we need HLS player (for Cloudflare Stream URLs) vs native video (for blob URLs)
  const needsHlsPlayer = item.type === 'video' && isHlsUrl(baseUrl);

  if (item.type === 'video') {
    return (
      <div 
        className={cn(cropClass, "select-none relative w-full h-full")} 
        style={{ minHeight: '200px' }}
        {...longPressProps}
        onClick={handleVideoTap}
      >
        {/* Skeleton loading state */}
        <div className={`absolute inset-0 ${showSkeleton ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
          <div className="w-full h-full animate-pulse bg-white/10" />
        </div>

        {/* Use HLSPlayer for Cloudflare Stream URLs, native video for blob URLs */}
        {needsHlsPlayer ? (
          <HLSPlayer
            ref={hlsPlayerRef}
            src={baseUrl}
            posterUrl={resolvedPosterUrl}
            autoplay={false}
            muted={forceVideoMuted}
            loop
            className={cn(
              "w-full h-full transition-all duration-300",
              objectFit === 'contain' ? 'object-contain' : 'object-cover',
              loaded ? 'scale-100 blur-0' : 'scale-105 blur-sm',
              filterClass
            )}
            objectFit={objectFit}
            showMuteButton={false}
            showPlayButton={false}
            managedByMediaRuntime={false}
            externallyManaged={false}
            preload="metadata"
            onLoadedData={() => {
              console.log('[CarouselSlide] HLS video loaded successfully');
              setLoaded(true);
              const player = hlsPlayerRef.current;
              if (player) {
                setDuration(player.getDuration());
                // Report dimensions if available
                const videoEl = player.getElement();
                if (videoEl && videoEl.videoWidth && videoEl.videoHeight) {
                  onDimensionsLoaded?.(item.id, videoEl.videoWidth, videoEl.videoHeight);
                }
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            onTimeUpdate={(current, dur) => {
              setCurrentTime(current);
              if (dur > 0) setDuration(dur);
            }}
            onError={(error) => console.error('[CarouselSlide] HLS error:', error)}
          />
        ) : (
          <video
            ref={videoRef}
            src={baseUrl}
            poster={resolvedPosterUrl}
            preload="metadata"
            playsInline
            controls={false}
            muted={forceVideoMuted}
            loop
            className={cn(
              "w-full h-full transition-all duration-300 block",
              objectFit === 'contain' ? 'object-contain' : 'object-cover',
              loaded ? 'scale-100 blur-0' : 'scale-105 blur-sm',
              filterClass
            )}
            style={{ 
              ...pixelStyle,
              width: '100%',
              height: '100%',
              minHeight: '200px',
              objectFit: objectFit,
              display: 'block',
            }}
            onLoadedMetadata={() => {
              console.log('[CarouselSlide] Video metadata loaded successfully');
              handleLoadedMetadata();
              // Report dimensions
              const video = videoRef.current;
              if (video && video.videoWidth && video.videoHeight) {
                onDimensionsLoaded?.(item.id, video.videoWidth, video.videoHeight);
              }
            }}
            onCanPlay={() => console.log('[CarouselSlide] Video can play')}
            onError={(e) => console.error('[CarouselSlide] Video error:', e.currentTarget.error)}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            onVolumeChange={(e) => {
              // If music is active and user tries to unmute, force mute and notify
              if (forceVideoMuted && !e.currentTarget.muted) {
                e.currentTarget.muted = true;
                onMuteBlocked?.();
              }
            }}
          />
        )}

        {/* Play icon overlay - ONLY visible when paused - circle container */}
        {loaded && !isPlaying && !hideVideoOverlays && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-3 h-3 text-white/90 fill-white/90 ml-0.5" />
            </div>
          </div>
        )}

        {/* Video badge in corner - DARK GLASS consistent - z-20 to sit above parent gradient scrims */}
        {!hideVideoOverlays && (
          <div className="absolute bottom-2 right-2 z-20 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-medium uppercase tracking-wide text-white">
            Video
          </div>
        )}

        {/* Countdown timer - bottom left - DARK GLASS - z-20 to sit above parent gradient scrims */}
        {loaded && duration > 0 && !hideVideoOverlays && (
          <div className="absolute bottom-2 left-2 z-20 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-xs font-medium text-white">
            {isPlaying ? formatTime(remainingTime) : formatTime(duration)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(cropClass, "select-none w-full h-full flex items-center justify-center")} {...longPressProps}>
      {/* Skeleton loading state */}
      <div className={`absolute inset-0 ${showSkeleton ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
        <div className="w-full h-full animate-pulse bg-white/10" />
      </div>

      <img
        src={posterUrl || '/placeholder.svg'}
        alt={item.alt || `Media item ${item.id}`}
        onLoad={(e) => {
          setLoaded(true);
          // Report dimensions
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            onDimensionsLoaded?.(item.id, img.naturalWidth, img.naturalHeight);
          }
        }}
        onError={(e) => {
          e.currentTarget.src = '/placeholder.svg';
          e.currentTarget.onerror = null;
        }}
        className={cn(
          "transition-all duration-300",
          objectFit === 'contain' 
            ? 'max-w-full max-h-full object-contain' 
            : 'w-full h-full object-cover',
          loaded ? 'scale-100 blur-0' : 'scale-105 blur-sm',
          filterClass
        )}
        style={pixelStyle}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
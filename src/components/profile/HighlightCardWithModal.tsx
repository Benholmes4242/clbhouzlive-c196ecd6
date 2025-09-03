import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Top100Highlight } from '@/hooks/useTop100Highlights';
import { MapPin, Play, Volume2, VolumeX } from 'lucide-react';
import { format } from 'date-fns';
import { uidFromNode, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import { useHighlightsVideo } from './HighlightsVideoController';
import { useLongPressPreview } from '@/hooks/useLongPressPreview';
import { useVideoPlaybackManager } from '@/contexts/VideoPlaybackManager';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import { cn } from '@/lib/utils';
import { useGlobalAudio } from '@/hooks/useGlobalAudio';
import CoursePostBadge from '@/components/posts/CoursePostBadge';

interface HighlightCardWithModalProps {
  highlight: Top100Highlight;
  onOpenModal: (postId: string) => void;
  isLandscape?: boolean;
}

const HighlightCardWithModal: React.FC<HighlightCardWithModalProps> = ({ 
  highlight, 
  onOpenModal,
  isLandscape = false
}) => {
  const primaryMedia = highlight.post_media[0];
  const createdDate = new Date(highlight.created_at);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isInView, setIsInView] = useState(true);
  
  // Check if browser supports requestVideoFrameCallback
  const supportsRVFC = typeof (HTMLVideoElement.prototype as any).requestVideoFrameCallback === "function";
  const globalAudio = useGlobalAudio();
  
  // Use the highlights video controller for carousel playback
  const { activeId, mutedPref, register, play, pause, toggleMute } = useHighlightsVideo();
  const isCarouselActive = activeId === highlight.id;

  // Use video playback manager for preview control
  const { pauseAllOtherVideos } = useVideoPlaybackManager();
  
  // Extract Cloudflare Stream ID for crisp thumbnails
  const extractCloudflareStreamId = (m3u8: string) => {
    const match = /\/([a-z0-9-]{16,})\/manifest\/video\.m3u8/i.exec(m3u8);
    return match?.[1] ?? null;
  };

  // For videos, use the HLS URL directly
  const videoId = primaryMedia?.media_type === 'video' ? uidFromNode({ media_url: primaryMedia.media_url }) : null;
  const streamId = videoId ? extractCloudflareStreamId(`https://videodelivery.net/${videoId}/manifest/video.m3u8`) : null;
  
  // Use high-res Cloudflare Stream thumbnail for crisp quality
  const posterUrl = streamId 
    ? generateThumbnailUrl(streamId, { width: 640, height: 360, time: 5 })
    : null;
  
  const hlsUrl = videoId ? `https://videodelivery.net/${videoId}/manifest/video.m3u8` : null;
  const carouselVideoRef = useRef<HTMLVideoElement>(null);

  // Register with video controller
  useEffect(() => {
    if (primaryMedia?.media_type === 'video') {
      register(highlight.id, carouselVideoRef.current);
    }
  }, [highlight.id, primaryMedia, register]);

  // Intersection observer to manage preview state based on visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const startPreview = useCallback(() => {
    if (!isInView || primaryMedia?.media_type !== 'video') return;
    
    pauseAllOtherVideos(highlight.id);
    setIsPreviewing(true);
    
    const video = previewVideoRef.current;
    if (!video) return;

    // Ensure attributes for autoplay
    video.muted = true;
    (video as any).playsInline = true;

    // Kick load if only metadata present
    if (video.readyState < 2) {
      video.load();
    }

    const onReady = () => setIsVideoReady(true);

    if (supportsRVFC && video.requestVideoFrameCallback) {
      // Reveal on first painted frame
      video.requestVideoFrameCallback(() => onReady());
    } else {
      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("canplay", onReady, { once: true });
    }

    // Start playback
    video.play().catch(() => {
      // Ignore policy interruptions
    });
  }, [isInView, primaryMedia, pauseAllOtherVideos, highlight.id, supportsRVFC]);

  const stopPreview = useCallback(() => {
    const video = previewVideoRef.current;
    if (video) {
      video.pause();
    }
    setIsVideoReady(false);
    setIsPreviewing(false);
  }, []);

  const handleOpenModal = useCallback(() => {
    // Always stop previews and carousel when opening modal
    stopPreview();
    pause(highlight.id);
    onOpenModal(highlight.id);
  }, [stopPreview, pause, onOpenModal, highlight.id]);

  // Long press gesture handling with proper preview functions
  const gestureHandlers = useLongPressPreview({
    onTap: handleOpenModal,
    onPreviewStart: () => {
      if (primaryMedia?.media_type === 'video' && !isCarouselActive) {
        startPreview();
      }
    },
    onPreviewStop: () => {
      if (!isCarouselActive) {
        stopPreview();
      }
    },
    longPressThreshold: 500
  });


  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryMedia?.media_type === 'video') {
      if (isCarouselActive) {
        pause(highlight.id);
      } else {
        play(highlight.id);
      }
    }
  }, [primaryMedia, isCarouselActive, play, pause, highlight.id]);

  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  }, [toggleMute]);

  // Safety check for media
  if (!primaryMedia) {
    return (
      <div className="flex-none w-80 bg-card rounded-xl overflow-hidden shadow-sm">
        <div className="relative h-48 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No media</span>
        </div>
        <div className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{highlight.golf_course.name}</h4>
            </div>
          </div>
          {highlight.content && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {highlight.content}
            </p>
          )}
          <div className="text-xs text-muted-foreground">
            {format(createdDate, 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={cardRef}
      className="group/highlight bg-card rounded-xl overflow-hidden shadow-sm cursor-pointer card-base card-highlights"
      role="button"
      tabIndex={0}
      aria-label="Open highlight post"
      {...gestureHandlers}
      onClick={handleVideoClick}
    >
      <div className="relative overflow-hidden rounded-2xl card-base card-highlights">
        {primaryMedia.media_type === 'image' ? (
          <img
            src={primaryMedia.media_url}
            alt="Golf course moment"
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <>
            {/* Carousel video (for click/tap play) */}
            {isCarouselActive && !isPreviewing ? (
              <>
                <HLSVideoCard
                  ref={carouselVideoRef}
                  hlsUrl={hlsUrl}
                  poster={posterUrl || undefined}
                  muted={mutedPref}
                  autoplay={false}
                  showMuteButton={false}
                  className="w-full h-full object-cover object-center"
                />
              </>
            ) : (
              /* Cross-fade preview system with poster and video layers */
              <div className="relative w-full h-full">
                {/* Poster layer - fades out when video is ready */}
                <img
                  src={posterUrl || primaryMedia.media_url}
                  alt="Video thumbnail"
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-150 ${
                    isPreviewing && isVideoReady ? 'opacity-0' : 'opacity-100'
                  }`}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />

                {/* Video layer - always mounted, fades in when ready */}
                <HLSVideoCard
                  ref={previewVideoRef}
                  hlsUrl={hlsUrl}
                  poster={posterUrl || undefined}
                  muted={true}
                  autoplay={false}
                  loop={true}
                  showMuteButton={false}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-150 will-change-opacity ${
                    isPreviewing && isVideoReady ? 'opacity-100' : 'opacity-0'
                  }`}
                  externallyManaged={true}
                />
                
                {/* Play button overlay - only shown when not previewing */}
                {!isPreviewing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <Play className="w-3 h-3 md:w-4 md:h-4 text-white ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {highlight.post_media.length > 1 && !isPreviewing && (
          <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded-md text-xs z-20">
            +{highlight.post_media.length - 1} more
          </div>
        )}
        
        {/* Golf Course Badge - Top Right */}
        {highlight.golf_course && !isPreviewing && (
          <div className="absolute top-3 right-3 z-20">
            <CoursePostBadge 
              course={{
                id: highlight.golf_course.id,
                name: highlight.golf_course.name,
                country: highlight.golf_course.country
              }}
              className="text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HighlightCardWithModal;
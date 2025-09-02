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

interface HighlightCardWithModalProps {
  highlight: Top100Highlight;
  onOpenModal: (postId: string) => void;
}

const HighlightCardWithModal: React.FC<HighlightCardWithModalProps> = ({ 
  highlight, 
  onOpenModal 
}) => {
  const primaryMedia = highlight.post_media[0];
  const createdDate = new Date(highlight.created_at);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isInView, setIsInView] = useState(true);
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
    ? `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${streamId}/thumbnails/thumbnail.jpg?height=900`
    : (videoId ? generateThumbnailUrl(videoId, { width: 320, height: 192, time: 1 }) : primaryMedia?.media_url);
    
  const hlsUrl = videoId ? `https://videodelivery.net/${videoId}/manifest/video.m3u8` : primaryMedia?.media_url;

  // Intersection observer to pause preview when out of view
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (!entry.isIntersecting && isPreviewing) {
          setIsPreviewing(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isPreviewing]);

  // Desktop hover handlers
  const handleMouseEnter = useCallback(() => {
    if (window.matchMedia('(hover: hover)').matches && primaryMedia?.media_type === 'video' && isInView) {
      setIsPreviewing(true);
      pauseAllOtherVideos('preview-' + highlight.id);
    }
  }, [primaryMedia?.media_type, isInView, pauseAllOtherVideos, highlight.id]);

  const handleMouseLeave = useCallback(() => {
    if (window.matchMedia('(hover: hover)').matches) {
      setIsPreviewing(false);
    }
  }, []);

  // Preview control functions
  const startPreview = useCallback(() => {
    if (primaryMedia?.media_type === 'video' && isInView) {
      setIsPreviewing(true);
      // Pause all other videos first
      pauseAllOtherVideos('preview-' + highlight.id);
    }
  }, [primaryMedia?.media_type, pauseAllOtherVideos, highlight.id, isInView]);

  const stopPreview = useCallback(() => {
    setIsPreviewing(false);
  }, []);

  const handleOpenModal = useCallback(() => {
    // Stop any preview or carousel video before opening modal
    stopPreview();
    if (isCarouselActive) {
      pause(highlight.id);
    }
    onOpenModal(highlight.id);
  }, [stopPreview, isCarouselActive, pause, highlight.id, onOpenModal]);

  // Setup long press preview gestures
  const gestureHandlers = useLongPressPreview({
    onTap: handleOpenModal,
    onPreviewStart: startPreview,
    onPreviewStop: stopPreview,
    longPressThreshold: 400
  });

  // Handle carousel video control (when not in preview mode)
  const handleVideoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryMedia?.media_type === 'video' && !gestureHandlers.isPreviewActive) {
      if (isCarouselActive) {
        pause(highlight.id);
      } else {
        play(highlight.id);
      }
    }
  }, [primaryMedia?.media_type, gestureHandlers.isPreviewActive, isCarouselActive, pause, play, highlight.id]);

  // Memoize the onReady callback for carousel video
  const carouselVideoRef = useRef<HTMLVideoElement>(null);
  
  // Register video when it becomes active
  React.useEffect(() => {
    if (isCarouselActive && carouselVideoRef.current) {
      register(highlight.id, carouselVideoRef.current);
    }
  }, [isCarouselActive, register, highlight.id]);

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
      className="group/highlight flex-none bg-card rounded-xl overflow-hidden shadow-sm cursor-pointer w-full"
      data-preview={isPreviewing ? 'true' : 'false'}
      role="button"
      tabIndex={0}
      aria-label="Open highlight post"
      {...gestureHandlers}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenModal();
        }
      }}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
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
            ) : !isPreviewing ? (
              /* Video thumbnail with play overlay */
              <div className="relative w-full h-full">
                <img
                  src={posterUrl || primaryMedia.media_url}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Play className="w-3 h-3 md:w-4 md:h-4 text-white ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* Feather gradient above glass panel */}
        <div
          className="
            pointer-events-none absolute inset-x-0 z-[9]
            bottom-[72px] md:bottom-[88px]
            h-8 md:h-10
            bg-gradient-to-t from-black/40 via-black/20 to-transparent
            transition-opacity duration-300 ease-out
            group-hover/highlight:opacity-0
            data-[preview=true]:opacity-0
            motion-reduce:transition-none
          "
        />

        {/* Liquid glass bottom panel — FLUSH, no outer gap */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 z-10",
          "bg-white/10 dark:bg-black/30 backdrop-blur-2xl",
          "border-t border-white/20",
          "rounded-b-2xl",
          "px-4 py-3 md:px-5 md:py-4",
          "transition-opacity duration-300 ease-out",
          "group-hover/highlight:opacity-0",
          "data-[preview=true]:opacity-0",
          "motion-reduce:transition-none"
        )}>
          <div className="flex items-start gap-2 mb-1">
            <MapPin className="w-3 h-3 md:w-4 md:h-4 text-white/80 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-xs md:text-sm text-white truncate">{highlight.golf_course.name}</h4>
            </div>
          </div>
          
          {highlight.content && (
            <p className="text-xs md:text-sm text-white/80 mb-1 line-clamp-2">
              {highlight.content}
            </p>
          )}
          
          <div className="text-xs text-white/60">
            {format(createdDate, "MMM d, yyyy")}
          </div>
        </div>

        {/* Quick preview overlay (covers entire card during long press) */}
        {isPreviewing && (
          <div className="absolute inset-0 z-10 rounded-2xl overflow-hidden">
            <HLSVideoCard
              ref={previewVideoRef}
              hlsUrl={hlsUrl}
              poster={posterUrl || undefined}
              muted={globalAudio.isGloballyMuted}
              autoplay={true}
              showMuteButton={false}
              className="w-full h-full object-cover object-center"
              onEnded={stopPreview}
            />
          </div>
        )}
        
        {highlight.post_media.length > 1 && !isPreviewing && (
          <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded-md text-xs z-20">
            +{highlight.post_media.length - 1} more
          </div>
        )}
      </div>
    </div>
  );
};

export default HighlightCardWithModal;
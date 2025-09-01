import React, { useCallback, useRef } from 'react';
import { Top100Highlight } from '@/hooks/useTop100Highlights';
import { MapPin, Play, Volume2, VolumeX } from 'lucide-react';
import { format } from 'date-fns';
import { uidFromNode, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import { useHighlightsVideo } from './HighlightsVideoController';
import { useLongPressPreview } from '@/hooks/useLongPressPreview';
import { useVideoPlaybackManager } from '@/contexts/VideoPlaybackManager';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import { COURSE_CARD_WIDTH_CLASSES } from '@/components/courses/netflix/shared-card-styles';

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
  
  // Use the highlights video controller for carousel playback
  const { activeId, mutedPref, register, play, pause, toggleMute } = useHighlightsVideo();
  const isCarouselActive = activeId === highlight.id;

  // Use video playback manager for preview control
  const { pauseAllOtherVideos } = useVideoPlaybackManager();
  
  // For videos, use the HLS URL directly
  const videoId = primaryMedia?.media_type === 'video' ? uidFromNode({ media_url: primaryMedia.media_url }) : null;
  const thumbnailUrl = videoId ? generateThumbnailUrl(videoId, { width: 320, height: 192, time: 1 }) : null;
  const hlsUrl = videoId ? `https://videodelivery.net/${videoId}/manifest/video.m3u8` : primaryMedia?.media_url;

  // Preview control functions
  const startPreview = useCallback(() => {
    if (primaryMedia?.media_type === 'video' && previewVideoRef.current) {
      // Pause all other videos first
      pauseAllOtherVideos('preview-' + highlight.id);
      
      // Start muted preview
      const video = previewVideoRef.current;
      video.muted = true;
      video.play().catch(console.error);
    }
  }, [primaryMedia?.media_type, pauseAllOtherVideos, highlight.id]);

  const stopPreview = useCallback(() => {
    if (previewVideoRef.current) {
      previewVideoRef.current.pause();
    }
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
      <div className={`${COURSE_CARD_WIDTH_CLASSES} bg-card border border-border rounded-xl overflow-hidden shadow-sm`}>
        <div className="relative aspect-[3/4] bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No media</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate text-white">{highlight.golf_course.name}</h4>
            </div>
          </div>
          {highlight.content && (
            <p className="text-sm text-white/80 mb-2 line-clamp-2">
              {highlight.content}
            </p>
          )}
          <div className="text-xs text-white/60">
            {format(createdDate, 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${COURSE_CARD_WIDTH_CLASSES} bg-card border border-border rounded-xl overflow-hidden shadow-sm cursor-pointer relative`}
      role="button"
      tabIndex={0}
      aria-label="Open highlight post"
      {...gestureHandlers}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenModal();
        }
      }}
    >
      <div className="relative aspect-[3/4] w-full">{/* Changed to match course card aspect ratio */}
        {primaryMedia.media_type === 'image' ? (
          <img
            src={primaryMedia.media_url}
            alt="Golf course moment"
            className="w-full h-full object-contain bg-black"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <>
            {/* Preview video (for hover/long-press) - invisible when not active */}
            {gestureHandlers.isPreviewActive && (
              <HLSVideoCard
                ref={previewVideoRef}
                hlsUrl={hlsUrl}
                poster={thumbnailUrl || undefined}
                muted={true}
                autoplay={false}
                className="absolute inset-0 z-10 pointer-events-none"
              />
            )}
            
            {/* Carousel video (for click/tap play) */}
            {isCarouselActive && !gestureHandlers.isPreviewActive ? (
              <>
                <HLSVideoCard
                  ref={carouselVideoRef}
                  hlsUrl={hlsUrl}
                  poster={thumbnailUrl || undefined}
                  muted={mutedPref}
                  autoplay={false}
                  className="w-full h-full pointer-events-none"
                />
                
                {/* Mute/Unmute Button - Top Right */}
                <div className="absolute top-3 right-3 z-20">
                  <button
                    onClick={handleMuteToggle}
                    className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 h-5 w-5 md:h-7 md:w-7 flex items-center justify-center hover:bg-white/20 transition-colors"
                    aria-label={mutedPref ? "Unmute video" : "Mute video"}
                  >
                    {mutedPref ? (
                      <VolumeX className="h-4 w-4 text-white" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
              </>
            ) : !gestureHandlers.isPreviewActive ? (
              /* Video thumbnail with play overlay */
              <div className="relative w-full h-full">
                <img
                  src={thumbnailUrl || primaryMedia.media_url}
                  alt="Video thumbnail"
                  className="w-full h-full object-contain bg-black"
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
        
        {highlight.post_media.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
            +{highlight.post_media.length - 1} more
          </div>
        )}
      </div>
      
      {/* Overlay content positioned absolutely */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-start gap-2 mb-2">
          <MapPin className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate text-white">{highlight.golf_course.name}</h4>
          </div>
        </div>
        
        {highlight.content && (
          <p className="text-sm text-white/80 mb-2 line-clamp-2">
            {highlight.content}
          </p>
        )}
        
        <div className="text-xs text-white/60">
          {format(createdDate, 'MMM d, yyyy')}
        </div>
      </div>
    </div>
  );
};

export default HighlightCardWithModal;
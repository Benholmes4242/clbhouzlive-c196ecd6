import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useTop100Highlights, Top100Highlight } from '@/hooks/useTop100Highlights';
import { ChevronLeft, ChevronRight, MapPin, Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/useDragScroll';
import { format } from 'date-fns';
import CountryFlag from '@/components/ui/country-flag';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import SoundToggle from '@/components/ui/sound-toggle';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';
import { uidFromNode, generateThumbnailUrl } from '@/utils/cloudflareStreamTransform';
import { HighlightsVideoProvider, useHighlightsVideo } from './HighlightsVideoController';

interface HighlightsCarouselProps {
  userId: string;
  className?: string;
}

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({ userId, className = '' }) => {
  const { highlights, isLoading, error } = useTop100Highlights(userId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragRefCallback = useDragScroll({ enabled: true, direction: 'horizontal' });
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Combined ref callback that handles both scroll container and drag functionality
  const combinedRefCallback = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
    dragRefCallback(node);
  }, [dragRefCallback]);

  // Handle scroll to update arrow visibility
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    handleScroll();

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, highlights]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (isLoading) {
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2 pt-2">
        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">Highlights From My Journey</h3>
      </div>
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-80 h-60 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
  }

  if (error || !highlights || highlights.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-2 pt-2">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">Highlights From My Journey</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🏌️‍♂️</div>
          <h4 className="text-lg font-semibold mb-2">No Top-100 Highlights Yet</h4>
          <p className="text-muted-foreground">
            Share photos and videos from your rounds at Top-100 courses to see them featured here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <HighlightsVideoProvider>
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-2 pt-2">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">Highlights From My Journey</h3>
          
          {highlights.length > 1 && (
            <div className="flex gap-2">
              {showLeftArrow && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollLeft}
                  className="w-8 h-8 p-0 hover:bg-accent"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              {showRightArrow && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollRight}
                  className="w-8 h-8 p-0 hover:bg-accent"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div 
          ref={combinedRefCallback}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            cursor: 'default'
          }}
        >
          {highlights.map((highlight) => (
            <HighlightCard key={highlight.id} highlight={highlight} />
          ))}
        </div>
      </div>
    </HighlightsVideoProvider>
  );
};

interface HighlightCardProps {
  highlight: Top100Highlight;
}

const HighlightCard: React.FC<HighlightCardProps> = ({ highlight }) => {
  const primaryMedia = highlight.post_media[0];
  const createdDate = new Date(highlight.created_at);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Use the highlights video controller
  const { activeId, mutedPref, register, play, pause, toggleMute } = useHighlightsVideo();
  const isActive = activeId === highlight.id;

  // Extract video ID and generate thumbnail URL
  const videoId = primaryMedia?.media_type === 'video' ? uidFromNode({ media_url: primaryMedia.media_url }) : null;
  const thumbnailUrl = videoId ? generateThumbnailUrl(videoId, { width: 320, height: 192, time: 1 }) : null;

  // Register the video element with the controller when active state changes
  useEffect(() => {
    if (isActive && videoRef.current && primaryMedia?.media_type === 'video') {
      register(highlight.id, videoRef.current);
    } else if (!isActive) {
      register(highlight.id, null);
    }
  }, [isActive, highlight.id, register, primaryMedia?.media_type]);

  const handleVideoClick = async () => {
    if (primaryMedia?.media_type === 'video') {
      if (isActive) {
        pause(highlight.id); // 2nd click pauses same card
      } else {
        await play(highlight.id); // 1st click (or switching) plays
      }
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
  };

  // Safety check for media
  if (!primaryMedia) {
    return (
      <div className="flex-none w-80 bg-card border border-border rounded-xl overflow-hidden shadow-sm">
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
    <div className="flex-none w-80 bg-card border border-border rounded-xl overflow-hidden shadow-sm cursor-pointer">
      <div className="relative h-56">
        {primaryMedia.media_type === 'image' ? (
          <img
            src={primaryMedia.media_url}
            alt="Golf course moment"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : isActive ? (
          <>
            <HLSVideoCard
              ref={videoRef}
              hlsUrl={primaryMedia.media_url}
              className="w-full h-full rounded-none"
              aspectRatio="auto"
              showMuteButton={false}
              showControls={false}
              autoplay={true}
              muted={mutedPref}
              loop={true}
              onClick={handleVideoClick}
              externallyManaged={true}
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
        ) : (
          /* Video thumbnail with play overlay */
          <div
            className="relative w-full h-full cursor-pointer group"
            onClick={handleVideoClick}
          >
            <img
              src={thumbnailUrl || primaryMedia.media_url}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-5 h-5 md:w-7 md:h-7 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Play className="w-3 h-3 md:w-4 md:h-4 text-white ml-0.5" fill="currentColor" />
              </div>
            </div>
          </div>
        )}
        
        {highlight.post_media.length > 1 && (
          <div className="absolute top-3 left-3 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
            +{highlight.post_media.length - 1} more
          </div>
        )}
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
};

export default HighlightsCarousel;
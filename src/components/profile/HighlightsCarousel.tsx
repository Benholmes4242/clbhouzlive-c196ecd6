import React, { useRef, useCallback, useState } from 'react';
import { useTop100Highlights, Top100Highlight } from '@/hooks/useTop100Highlights';
import { ChevronLeft, ChevronRight, MapPin, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/useDragScroll';
import { format } from 'date-fns';
import CountryFlag from '@/components/ui/country-flag';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import SoundToggle from '@/components/ui/sound-toggle';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';

interface HighlightsCarouselProps {
  userId: string;
  className?: string;
}

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({ userId, className = '' }) => {
  const { highlights, isLoading, error } = useTop100Highlights(userId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragRefCallback = useDragScroll({ enabled: true, direction: 'horizontal' });

  // Combined ref callback that handles both scroll container and drag functionality
  const combinedRefCallback = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
    dragRefCallback(node);
  }, [dragRefCallback]);

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
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2 pt-2">
        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">Highlights From My Journey</h3>
        
        {highlights.length > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollLeft}
              className="w-8 h-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollRight}
              className="w-8 h-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div 
        ref={combinedRefCallback}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          cursor: 'grab'
        }}
      >
        {highlights.map((highlight) => (
          <HighlightCard key={highlight.id} highlight={highlight} />
        ))}
      </div>
    </div>
  );
};

interface HighlightCardProps {
  highlight: Top100Highlight;
}

const HighlightCard: React.FC<HighlightCardProps> = ({ highlight }) => {
  const primaryMedia = highlight.post_media[0];
  const createdDate = new Date(highlight.created_at);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Use exclusive video audio for proper audio management
  const { isMuted: videoIsMuted, toggleMute: toggleVideoMute } = useExclusiveVideoAudio(`highlight-${highlight.id}`);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

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
    <div className="flex-none w-80 bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-48">
        {primaryMedia.media_type === 'image' ? (
          <img
            src={primaryMedia.media_url}
            alt="Golf course moment"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <HLSVideoCard
              ref={videoRef}
              hlsUrl={primaryMedia.media_url}
              className="w-full h-full rounded-none"
              aspectRatio="auto"
              showMuteButton={false}
              showControls={false}
              autoplay={false}
              muted={videoIsMuted}
              loop={true}
              onClick={handleVideoClick}
              onPlay={handlePlay}
              onPause={handlePause}
              externallyManaged={true}
            />
            
            {/* Play button overlay when video is paused */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-12 h-12 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
            
            {/* Mute/Unmute Button - Top Right */}
            <div className="absolute top-3 right-3 z-20">
              <SoundToggle
                isMuted={videoIsMuted}
                onToggle={toggleVideoMute}
                size="sm"
              />
            </div>
          </>
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
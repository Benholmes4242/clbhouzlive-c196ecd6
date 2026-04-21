import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { HiTrendingUp } from 'react-icons/hi';
import { useSwipeable } from 'react-swipeable';
import { ExploreContentItem } from '@/components/explore/types';
import { useMediaAutoplay } from '@/media';
import MediaDisplay from '@/components/explore/MediaDisplay';
import { useVideoReadyQueue } from '@/hooks/useVideoReadyQueue';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface DiscoverTrendingVideosProps {
  videos: ExploreContentItem[];
  onVideoClick: (item: ExploreContentItem) => void;
}

const DiscoverTrendingVideos: React.FC<DiscoverTrendingVideosProps> = ({ videos, onVideoClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [activeButton, setActiveButton] = useState<'left' | 'right' | null>(null);
  
  // Get first 8 videos for trending
  const trendingVideos = videos.filter(item => item.type === 'video').slice(0, 8);
  
  // Unified media autoplay system
  const { registerMedia, playingIds } = useMediaAutoplay({
    mode: 'grid',
    startThreshold: 0.4,
    stopThreshold: 0.35,
  });

  // Video ready queue integration
  const {
    initiatePrefetch,
    markReady,
    isReady,
    readySet,
  } = useVideoReadyQueue({
    prefetchAhead: 4,
    prefetchBehind: 2,
    onVideoReady: (id) => console.log(`[DiscoverTrendingVideos] Video ${id.substring(0, 8)} marked ready`),
  });

  const markReadyRef = useRef(markReady);
  markReadyRef.current = markReady;

  // CRITICAL: Use stream UIDs for cache consistency
  const videoIds = useMemo(() => {
    return trendingVideos.map(video => {
      const streamId = uidFromNode({ src: video.src });
      return streamId || video.id;
    });
  }, [trendingVideos]);

  // Create videoUrlMap keyed by stream UID
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    trendingVideos.forEach(video => {
      if (video.src) {
        const streamId = uidFromNode({ src: video.src });
        if (streamId) {
          map.set(streamId, generateStreamHlsUrl(streamId));
        }
      }
    });
    return map;
  }, [trendingVideos]);

  // Trigger prefetch
  useEffect(() => {
    if (videoIds.length > 0 && videoUrlMap.size > 0) {
      initiatePrefetch(videoIds, currentIndex, videoUrlMap);
    }
  }, [videoIds, videoUrlMap, currentIndex, initiatePrefetch]);

  // Loading boundary
  const MINIMUM_READY_COUNT = 2;
  const readyCount = useMemo(() => {
    let count = 0;
    videoIds.forEach(id => { if (readySet.has(id)) count++; });
    return count;
  }, [videoIds, readySet]);

  const isFeedReady = readyCount >= Math.min(MINIMUM_READY_COUNT, videoIds.length) || videoIds.length === 0;
  
  // Function to clean title text and remove golf course information
  const cleanTitleText = (title: string) => {
    if (!title) return '';
    
    // Remove golf course patterns from title
    return title
      .replace(/\s*Played at\s+[^.!?]*[.!?]?\s*/gi, '')
      .replace(/\s*#golf\s*/gi, '')
      .replace(/\s*#family\s*/gi, '')
      .replace(/\s*#chaos\s*/gi, '')
      .replace(/\s*⛳\s*/gi, '')
      .replace(/\s*📍\s*/gi, '')
      .replace(/\s*🏌️\s*/gi, '')
      .replace(/\s*🏌️‍♂️\s*/gi, '')
      .replace(/\s*🏌️‍♀️\s*/gi, '')
      .trim();
  };
  
  // Function to truncate title to 5 words for preview
  const truncateTitle = (title: string) => {
    const cleanedTitle = cleanTitleText(title);
    if (!cleanedTitle) return '';
    
    const words = cleanedTitle.split(' ');
    if (words.length <= 5) return cleanedTitle;
    
    return words.slice(0, 5).join(' ') + '...';
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nextVideo = () => {
    setCurrentIndex((prev) => (prev + 1) % trendingVideos.length);
  };

  const prevVideo = () => {
    setCurrentIndex((prev) => (prev - 1 + trendingVideos.length) % trendingVideos.length);
  };

  const handleVideoClick = (index: number) => {
    const video = trendingVideos[index];
    if (video) {
      onVideoClick(video);
    }
  };

  const handleButtonClick = (direction: 'left' | 'right', action: () => void, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveButton(direction);
    action();
    // Remove active state after animation
    setTimeout(() => setActiveButton(null), 150);
  };

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile) {
        nextVideo();
      }
    },
    onSwipedRight: () => {
      if (isMobile) {
        prevVideo();
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  if (trendingVideos.length === 0) return null;

  const visibleVideos = isMobile ? 2 : 3; // Mobile: 2 cards, Desktop: 3 cards
  const currentVideos = trendingVideos.slice(currentIndex, currentIndex + visibleVideos);
  
  // Handle wrap around
  if (currentVideos.length < visibleVideos) {
    const remaining = visibleVideos - currentVideos.length;
    currentVideos.push(...trendingVideos.slice(0, remaining));
  }

  // Loading skeleton - use lightweight placeholders instead of spinners
  if (!isFeedReady) {
    return (
      <div className="container mx-auto px-4 md:px-0 pt-6 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-foreground">Trending</h2>
        </div>
        <div className={`grid gap-1 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {Array.from({ length: visibleVideos }).map((_, i) => (
            <div key={i} className="aspect-[1080/1350] bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-0 pt-6 pb-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">Trending</h2>
      </div>

      <div className="relative">
        {/* Grid with 1080x1350 aspect ratio */}
        <div className={`grid gap-1 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`} {...(isMobile ? swipeHandlers : {})}>
          {currentVideos.map((video, index) => {
            const actualIndex = (currentIndex + index) % trendingVideos.length;
            const mediaId = `discover-trending-${video.id}`;
            const isPlaying = playingIds.has(mediaId);
            // CRITICAL: Use stream UID for cache lookup
            const streamId = uidFromNode({ src: video.src }) || video.id;
            const videoIsReady = isReady(streamId);
            
            // Video ref callback for media registration - will be passed to MediaDisplay
            const videoRefCallback = useCallback((el: HTMLVideoElement | null) => {
              if (el) {
                registerMedia({
                  id: mediaId,
                  element: el,
                  isCandidate: true,
                  sortIndex: actualIndex,
                });
              }
            }, [mediaId, actualIndex]);
            
            return (
              <div
                key={`${video.id}-${actualIndex}`}
                className="relative bg-muted overflow-hidden cursor-pointer group aspect-[1080/1350]"
                style={{ borderRadius: '8px' }}
                onClick={() => handleVideoClick(actualIndex)}
              >
                {/* Media Display - opacity controlled by ready state */}
                <div className={cn(
                  "absolute inset-0 transition-opacity duration-200",
                  videoIsReady ? "opacity-100" : "opacity-0"
                )}>
                  <MediaDisplay
                    media={{
                      id: video.id,
                      media_type: 'video',
                      media_url: video.src
                    }}
                    itemTitle={video.title}
                    shouldAutoplay={isPlaying}
                    isLoading={false}
                    onImageError={() => {}}
                    onImageLoad={() => {}}
                    onLoaded={() => markReadyRef.current(video.id)}
                    itemId={video.id}
                    currentIndex={actualIndex}
                    loop={true}
                    hidePlayButton={true}
                    videoRefCallback={videoRefCallback}
                    studioEdits={video.media?.[0]?.studio_edits}
                  />
                </div>
                
                {/* Poster image until video ready */}
                {!videoIsReady && video.thumbnailSrc && (
                  <img
                    src={video.thumbnailSrc}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Trending Icon */}
                <div className="absolute top-3 right-3">
                  <HiTrendingUp className="w-8 h-8 drop-shadow-lg" style={{ color: '#f7931e' }} />
                </div>
                
                {/* User info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2">
                    <SquircleAvatar
                      src={video.user?.avatar || null}
                      alt={video.user?.name || video.user?.username || 'Anonymous'}
                      userId={(video.user as any)?.id ?? null}
                      size={48}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-base font-medium truncate">
                        {video.user?.name || video.user?.username || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiscoverTrendingVideos;

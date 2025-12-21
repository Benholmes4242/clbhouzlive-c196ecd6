import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { InterleavedItem } from '@/utils/interleaveFeed';
import { ChannelSuggestionCard } from './ChannelSuggestionCard';
import { ChannelSuggestion } from '@/hooks/useChannelSuggestions';
import ShortsInlineBlock from './ShortsInlineBlock';
import ShortsViewer from '@/components/shorts/ShortsViewer';
import { useGridAutoplay } from '@/hooks/useGridAutoplay';
import GridAutoplayVideo from '@/components/profile/activity/GridAutoplayVideo';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideosGridProps {
  content: ExploreContentItem[];
  onMediaClick?: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isShorts?: boolean;
  activeTab?: string;
  interleavedFeed?: InterleavedItem[] | null;
}

/**
 * VideosGrid - Video feed grid with autoplay
 * 
 * ALIGNED WITH BUSINESS ACTIVITY:
 * Uses useGridAutoplay hook + GridAutoplayVideo component (same as BusinessPostCard)
 * for consistent IntersectionObserver behavior across iOS WKWebView/Capacitor.
 */
const VideosGrid: React.FC<VideosGridProps> = ({
  content,
  onMediaClick,
  isLoading,
  hasMore,
  onLoadMore,
  isShorts = false,
  activeTab = 'all',
  interleavedFeed = null
}) => {
  // ShortsViewer state
  const [shortsViewerOpen, setShortsViewerOpen] = useState(false);
  const [shortsViewerItems, setShortsViewerItems] = useState<ExploreContentItem[]>([]);
  const [shortsViewerIndex, setShortsViewerIndex] = useState(0);

  // BUSINESS ACTIVITY PATTERN: useGridAutoplay with same settings
  const { registerVideo, playingIds } = useGridAutoplay({
    maxPlaying: 1,
    visibilityThreshold: 0.6,
    preloadMargin: 300,
    scrollSettleDelay: 200,
  });

  const handleShortClick = (short: ExploreContentItem, allShorts: ExploreContentItem[], index: number) => {
    setShortsViewerItems(allShorts);
    setShortsViewerIndex(index);
    setShortsViewerOpen(true);
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.3 }
    );

    const sentinel = document.getElementById('videos-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  // Build items to render
  const itemsToRender = interleavedFeed 
    ? interleavedFeed 
    : content.filter(item => item.type === 'video').map(video => ({
        kind: 'video' as const,
        id: video.id,
        data: video
      }));

  if (itemsToRender.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">🎥</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No videos found</h3>
        <p className="text-muted-foreground max-w-md">
          No videos match these filters. Try a different duration or topic.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Landscape cards layout - full width edge to edge */}
      <div className="flex flex-col gap-3 pb-4">
        {itemsToRender.map((item, index) => {
          if (item.kind === 'channel_suggestion') {
            return (
              <ChannelSuggestionCard
                key={item.id}
                suggestion={item.data as ChannelSuggestion}
                className="w-full mt-[10px] mb-[30px]"
              />
            );
          }
          
          if (item.kind === 'shorts_block' && Array.isArray(item.data)) {
            return (
              <ShortsInlineBlock
                key={item.id}
                shorts={item.data}
                blockId={item.id}
                onShortClick={(short, idx) => handleShortClick(short, item.data as ExploreContentItem[], idx)}
              />
            );
          }
          
          // Video card with Business Activity autoplay pattern
          return (
            <VideoCardWithAutoplay
              key={`${activeTab}-${item.id}`}
              item={item.data as ExploreContentItem}
              onClick={() => onMediaClick?.(item.data as ExploreContentItem)}
              registerVideo={registerVideo}
              isPlaying={playingIds.has(item.id)}
              videoIndex={index}
            />
          );
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div id="videos-scroll-sentinel" className="h-4 mt-8">
        {isLoading && hasMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* ShortsViewer */}
      {shortsViewerOpen && (
        <ShortsViewer
          items={shortsViewerItems}
          initialIndex={shortsViewerIndex}
          isOpen={shortsViewerOpen}
          onClose={() => setShortsViewerOpen(false)}
        />
      )}
    </>
  );
};

/**
 * VideoCardWithAutoplay - Landscape video card using Business Activity pattern
 * Uses GridAutoplayVideo + registerVideo (exact same as BusinessPostCard)
 */
interface VideoCardWithAutoplayProps {
  item: ExploreContentItem;
  onClick: () => void;
  registerVideo: ReturnType<typeof useGridAutoplay>['registerVideo'];
  isPlaying: boolean;
  videoIndex: number;
}

const VideoCardWithAutoplay: React.FC<VideoCardWithAutoplayProps> = ({
  item,
  onClick,
  registerVideo,
  isPlaying,
  videoIndex,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const videoIndexRef = useRef(videoIndex);
  videoIndexRef.current = videoIndex;

  // Generate HLS URL from stream ID
  const uid = item.src ? uidFromNode({ src: item.src }) : null;
  const hlsUrl = uid ? `https://videodelivery.net/${uid}/manifest/video.m3u8` : null;
  const streamId = item.src ? getStreamIdFromUrl(item.src) : null;
  const posterUrl = item.thumbnailSrc ?? (streamId ? getStreamPoster(streamId, '0s', 720) : undefined);

  const hasVideo = !!hlsUrl;

  // Reset state when video changes
  useEffect(() => {
    setIsVideoReady(false);
    setHasVideoError(false);
  }, [item.id, hlsUrl]);

  // BUSINESS ACTIVITY PATTERN: immediate + 100ms retry registration
  useEffect(() => {
    if (!registerVideo || !hasVideo) return;

    const isCandidate = true;

    const checkAndRegister = () => {
      const videoEl = videoRef.current;
      if (videoEl) {
        registerVideo({
          id: item.id,
          element: videoEl,
          isCandidate,
          sortIndex: videoIndexRef.current,
        });
      }
    };

    // Immediate + 100ms retry (matches StandardPostTile/UnifiedMediaTile/LongFormVideoTileAutoplay)
    checkAndRegister();
    const retryTimer = setTimeout(checkAndRegister, 100);

    return () => {
      clearTimeout(retryTimer);
      registerVideo({
        id: item.id,
        element: null,
        isCandidate,
        sortIndex: videoIndexRef.current,
      });
    };
  }, [registerVideo, item.id, hasVideo]);

  const handleCanPlay = useCallback(() => {
    setIsVideoReady(true);
  }, []);

  const handleError = useCallback(() => {
    setHasVideoError(true);
  }, []);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <button
      onClick={onClick}
      className="group relative block w-full p-0 border-0 bg-transparent leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-transform duration-75 active:scale-[0.98] active:opacity-95"
      aria-label={`Play video: ${item.title || 'Video'} by ${item.user?.name || 'Unknown'}`}
    >
      {/* Thumbnail Container - 16:9 landscape */}
      <div 
        className="relative overflow-hidden bg-black"
        style={{ 
          width: '100%',
          aspectRatio: '16/9',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 6px 16px rgba(0,0,0,0.06)',
        }}
      >
        {/* Thumbnail ALWAYS visible as fallback (prevents grey box) */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        )}

        {/* Video layer - fades in when ready (BUSINESS ACTIVITY PATTERN) */}
        {hasVideo && (
          <GridAutoplayVideo
            ref={videoRef}
            src={hlsUrl}
            poster={posterUrl}
            onCanPlay={handleCanPlay}
            onError={handleError}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-150",
              isVideoReady && !hasVideoError ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

        {/* Glass panel + avatar for landscape videos */}
        <div className="absolute bottom-2 right-0 z-10 pointer-events-none">
          <div
            className="liquid-glass liquid-glass--elevated flex flex-col min-w-[180px] max-w-[240px] px-3 py-1 rounded-l-xl rounded-r-none transition-transform duration-200 group-hover:scale-[1.02] border-r-0"
          >
            {/* Creator name */}
            <div className="text-white font-semibold text-body-md leading-tight flex items-center gap-2">
              <span className="truncate">
                {item.user?.name || 'Unknown'}
              </span>
            </div>

            {/* Divider line */}
            <div className="mt-1 mb-1.5 h-px w-[calc(100%-4px)] bg-white/20" />

            {/* Likes row */}
            <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-normal leading-snug">
              <Heart className="w-3 h-3" />
              <span>{item.likes || 0}</span>
            </div>
          </div>

          {/* Avatar squircle */}
          <div
            className="absolute right-[8px] bottom-[10px] w-[48px] h-[48px] rounded-[12px] overflow-hidden border border-white/30 bg-black/40 backdrop-blur-md"
            style={{ boxShadow: '0 16px 32px rgba(0, 0, 0, 0.6)' }}
          >
            <img
              src={item.user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
              alt={item.user?.name || 'Unknown'}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Duration badge */}
          {item.duration && typeof item.duration === 'number' && (
            <div 
              className="absolute right-2 bottom-[-8px] text-body-sm font-medium leading-none px-1.5 py-0.5 rounded-[6px] text-white/90 border border-white/25 z-10"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)'
              }}
            >
              {formatDuration(item.duration)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default VideosGrid;

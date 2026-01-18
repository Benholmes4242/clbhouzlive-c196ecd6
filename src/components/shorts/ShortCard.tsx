import React, { useRef, useCallback, useEffect } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import ShortsCardMeta from './ShortsCardMeta';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { Squircle } from '@/components/ui/squircle';
import { Heart, Loader2 } from 'lucide-react';
import TrendingBadge from '@/components/discover/TrendingBadge';
import SuggestedBadge from '@/components/discover/SuggestedBadge';
import '@/styles/shorts-meta.css';
import { cn } from '@/lib/utils';

interface ShortCardProps {
  item: ExploreContentItem;
  onClick: () => void;
  height?: number;
  isPinned?: boolean;
  shouldAttach?: boolean;
  autoplay?: boolean;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
  variant?: 'portrait' | 'landscape';
  useGlassPanel?: boolean;
  isTrending?: boolean;
  isSuggested?: boolean;
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
}

export default React.memo(function ShortCard({ 
  item, 
  onClick, 
  height, 
  isPinned,
  shouldAttach = false,
  autoplay = false,
  onLike,
  onAuthorClick,
  currentUserId,
  variant = 'portrait',
  useGlassPanel = true,
  isTrending = false,
  isSuggested = false,
  isVideoReady = false,
  onReady,
}: ShortCardProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const hasReportedReadyRef = useRef(false);
  const isVideo = item.type === 'video' || item.src?.includes('.mp4') || item.src?.includes('.webm');
  
  // Generate HLS URL and poster from Stream ID
  const uid = item.src ? uidFromNode({ src: item.src }) : null;
  const hlsUrl = uid ? generateStreamHlsUrl(uid) : item.src;
  const streamId = item.src ? getStreamIdFromUrl(item.src) : null;
  const posterUrl = item.thumbnailSrc ?? (streamId ? getStreamPoster(streamId, '0s', 720) : undefined);
  
  const isLandscape = variant === 'landscape';
  
  // Reset ready flag when item changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
  }, [item.id]);
  
  // Handle video ready
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && isVideo) {
      hasReportedReadyRef.current = true;
      console.log(`[ShortCard] Video ${item.id.substring(0, 8)} ready (canplaythrough)`);
      onReady?.(item.id);
    }
  }, [item.id, isVideo, onReady]);
  
  return (
    <button
      onClick={onClick}
      className="shortsCard group relative block w-full p-0 border-0 bg-transparent leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-transform duration-75 active:scale-[0.98] active:opacity-95"
      style={{ margin: 0 }}
      aria-label={`Play short: ${item.title || 'Video'} by ${item.user?.name || 'Golfer'}`}
    >
      {/* Thumbnail Container */}
      <div 
        className="relative overflow-hidden bg-black"
        style={{ 
          width: '100%',
          maxWidth: '100%',
          height: height ? `${height}px` : undefined,
          aspectRatio: isLandscape ? '16/11.592' : (!height ? '9/16' : undefined),
          boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 6px 16px rgba(0,0,0,0.06)',
          borderRadius: '0'
        }}
      >
        {/* Video with HLSPlayer - paused-video-first architecture */}
        {isVideo && hlsUrl ? (
          <>
            {/* HLSPlayer - always mounted, opacity controlled by ready state */}
            <div className={cn(
              "absolute inset-0 transition-opacity duration-200",
              isVideoReady ? "opacity-100" : "opacity-0"
            )}>
                <HLSPlayer
                ref={playerRef}
                src={hlsUrl}
                autoplay={false}
                muted
                loop
                showMuteButton={false}
                showPlayButton={false}
                objectFit="cover"
                managedByMediaRuntime={true}
                externallyManaged={true}
                mediaId={uidFromNode({ src: item.src }) || item.id}
                className="w-full h-full"
                onCanPlayThrough={handleCanPlayThrough}
              />
            </div>
            
            {/* Skeleton - only before video is buffered */}
            {!isVideoReady && (
              <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            )}
          </>
        ) : (
          <img
            src={posterUrl || item.src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

        {/* Unified meta layout - same for portrait and landscape */}
        <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
          {/* Text content - bottom left */}
          <div className="absolute left-3 bottom-3 flex flex-col gap-1 max-w-[calc(100%-80px)]">
            {/* Likes row */}
            <div className="flex items-center gap-1 text-white/50 text-[10px] leading-none font-normal">
              <Heart className="w-3 h-3" />
              <span>{item.likes || 0}</span>
            </div>

            {/* User name */}
            <div className="text-white font-bold text-body-md leading-tight">
              <span className="truncate block">{item.user?.name || 'Golfer'}</span>
            </div>
          </div>

          {/* Avatar - bottom right */}
          <div
            className="absolute right-3 bottom-3 w-[40px] h-[40px] rounded-[10px] overflow-hidden bg-black/40 backdrop-blur-md"
            style={{ boxShadow: '0 16px 32px rgba(0, 0, 0, 0.6)' }}
          >
            <img
              src={item.user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
              alt={item.user?.name || 'Golfer'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </button>
  );
}, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.isVideoReady === next.isVideoReady &&
    prev.autoplay === next.autoplay
  );
});

import React, { useRef } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useAutoplayGuard } from '@/hooks/useAutoplayGuard';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import ShortsCardMeta from './ShortsCardMeta';
import '@/styles/shorts-meta.css';

interface ShortCardProps {
  item: ExploreContentItem;
  onClick: () => void;
  height?: number;
  isPinned?: boolean;
  autoplay?: boolean;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
  variant?: 'portrait' | 'landscape'; // New: Support landscape cards
}

export default React.memo(function ShortCard({ 
  item, 
  onClick, 
  height, 
  isPinned, 
  autoplay,
  onLike,
  onAuthorClick,
  currentUserId,
  variant = 'portrait'
}: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = item.type === 'video' || item.src?.includes('.mp4') || item.src?.includes('.webm');
  
  // Generate poster URL from Stream ID or use existing thumbnailSrc
  const streamId = item.src ? getStreamIdFromUrl(item.src) : null;
  const posterUrl = item.thumbnailSrc ?? (streamId ? getStreamPoster(streamId, '0s', 720) : undefined);
  
  // Guard autoplay - handles browser blocking gracefully
  const autoplayBlocked = useAutoplayGuard(videoRef, isVideo && !!autoplay);
  
  const isLandscape = variant === 'landscape';
  
  return (
    <button
      onClick={onClick}
      className="shortsCard group relative block w-full p-0 border-0 bg-transparent leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-transform duration-75"
      style={{ margin: 0 }}
      aria-label={`Play short: ${item.title || 'Video'} by ${item.user?.name || 'Unknown'}`}
    >
      {/* Thumbnail Container */}
      <div 
        className="relative overflow-hidden bg-muted"
        style={{ 
          width: '100%',
          maxWidth: '100%',
          height: height ? `${height}px` : undefined,
          aspectRatio: isLandscape ? '16/11.592' : (!height ? '9/16' : undefined),
          boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 6px 16px rgba(0,0,0,0.06)',
          borderRadius: '0'
        }}
      >
        {/* Video with poster fallback - always render video element for consistency */}
        {isVideo ? (
          <video
            ref={videoRef}
            src={item.src}
            poster={posterUrl}
            className="absolute inset-0 h-full w-full object-cover"
            loop
            muted
            playsInline
            preload="metadata"
            data-autoplay-blocked={autoplayBlocked ? '1' : '0'}
          />
        ) : (
          <img
            src={posterUrl || item.src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        )}

        {/* Gradient overlay for badges */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />



        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

        {/* Creator-First Meta Block - Overlaid at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <ShortsCardMeta
            author={{
              id: item.user?.id ?? '',
              name: item.user?.name ?? 'Unknown',
              avatar: item.user?.avatar ?? '/img/avatar-fallback.png',
              verified: item.user?.verified,
              isSelf: item.user?.id === currentUserId
            }}
            caption={item.title ?? ''}
            likeCount={item.likes ?? 0}
            isLiked={false} // Wire in PR2 with real state
            onLikeToggle={() => onLike?.(item.id)}
            onAuthorClick={(id) => onAuthorClick?.(id)}
          />
        </div>
      </div>
    </button>
  );
});

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
}

export default React.memo(function ShortCard({ 
  item, 
  onClick, 
  height, 
  isPinned, 
  autoplay,
  onLike,
  onAuthorClick,
  currentUserId
}: ShortCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = item.type === 'video' || item.src?.includes('.mp4') || item.src?.includes('.webm');
  
  // Generate poster URL from Stream ID or use existing thumbnailSrc
  const streamId = item.src ? getStreamIdFromUrl(item.src) : null;
  const posterUrl = item.thumbnailSrc ?? (streamId ? getStreamPoster(streamId, '0s', 720) : undefined);
  
  // Guard autoplay - handles browser blocking gracefully
  const autoplayBlocked = useAutoplayGuard(videoRef, isVideo && !!autoplay);
  
  return (
    <button
      onClick={onClick}
      className="group relative w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl active:scale-[0.98] transition-transform duration-75"
      aria-label={`Play short: ${item.title || 'Video'} by ${item.user?.name || 'Unknown'}`}
    >
      {/* Thumbnail Container */}
      <div 
        className="relative w-full overflow-hidden bg-muted mb-2"
        style={{ 
          height: height ? `${height}px` : undefined,
          aspectRatio: !height ? '9/16' : undefined,
          boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 6px 16px rgba(0,0,0,0.06)',
          borderRadius: 'clamp(16px, 2.2vmin, 24px)',
          WebkitMaskImage: 'url("/ui/shorts-squircle-9x16.svg")',
          maskImage: 'url("/ui/shorts-squircle-9x16.svg")',
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center'
        }}
      >
        {/* Video with poster fallback - always render video element for consistency */}
        {isVideo ? (
          <video
            ref={videoRef}
            src={item.src}
            poster={posterUrl}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Gradient overlay for badges */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />



        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>

      {/* Creator-First Meta Block */}
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
    </button>
  );
});

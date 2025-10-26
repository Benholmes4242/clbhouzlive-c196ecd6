import React, { useRef } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import ShortsCardMeta from './ShortsCardMeta';
import HLSVideoCard from '@/components/ui/HLSVideoCard';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { Squircle } from '@/components/ui/squircle';
import { Heart } from 'lucide-react';
import '@/styles/shorts-meta.css';

interface ShortCardProps {
  item: ExploreContentItem;
  onClick: () => void;
  height?: number;
  isPinned?: boolean;
  shouldAttach?: boolean; // Prebuffer when near viewport
  autoplay?: boolean;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
  variant?: 'portrait' | 'landscape'; // Support landscape cards
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
  variant = 'portrait'
}: ShortCardProps) {
  const isVideo = item.type === 'video' || item.src?.includes('.mp4') || item.src?.includes('.webm');
  
  // Generate HLS URL and poster from Stream ID
  const uid = item.src ? uidFromNode({ src: item.src }) : null;
  const hlsUrl = uid ? `https://videodelivery.net/${uid}/manifest/video.m3u8` : item.src;
  const streamId = item.src ? getStreamIdFromUrl(item.src) : null;
  const posterUrl = item.thumbnailSrc ?? (streamId ? getStreamPoster(streamId, '0s', 720) : undefined);
  
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
        {/* Video with HLSVideoCard for optimal performance */}
        {isVideo && hlsUrl ? (
          <HLSVideoCard
            hlsUrl={hlsUrl}
            poster={posterUrl}
            className="absolute inset-0 w-full h-full"
            aspectRatio={isLandscape ? '16/11.592' : '9/16'}
            muted={true}
            loop={true}
            shouldAttach={shouldAttach}
            autoplay={autoplay}
            showMuteButton={false}
            externallyManaged={true}
            fit="cover"
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

        {/* Conditional Meta based on variant */}
        {isLandscape ? (
          /* Unified glass panel + avatar for landscape videos */
          <div className="absolute bottom-2 right-0 z-10 pointer-events-none">
            {/* Glass panel - flush to right edge */}
            <div
              className="flex flex-col min-w-[180px] max-w-[240px] px-3 py-2 rounded-l-xl rounded-r-none backdrop-blur-md transition-transform duration-200 group-hover:scale-[1.02]"
              style={{
                background: 'rgba(20, 20, 20, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
              }}
            >
              {/* Creator name */}
              <div className="text-white font-semibold text-[15px] leading-tight flex items-center gap-2">
                <span className="truncate">
                  {item.user?.name || 'Unknown'}
                </span>
              </div>

              {/* Divider line */}
              <div className="my-1 h-px w-[calc(100%-4px)] bg-white/20" />

              {/* Likes row */}
              <div className="flex items-center gap-2 text-white/90 text-[13px] leading-none">
                <Heart className="w-3.5 h-3.5" />
                <span className="tracking-[-0.02em]">{item.likes || 0} likes</span>
              </div>
            </div>

            {/* Avatar squircle - positioned 14px from right edge, 95% overlaps panel, 5% extends above */}
            <div
              className="absolute right-[14px] bottom-2 w-[56px] h-[56px] rounded-[14px] overflow-hidden border border-white/30 bg-black/40 backdrop-blur-md"
              style={{
                boxShadow: '0 16px 32px rgba(0, 0, 0, 0.6)'
              }}
            >
              <img
                src={item.user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                alt={item.user?.name || 'Unknown'}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Duration badge - attached to squircle */}
            {item.duration && typeof item.duration === 'number' && (
              <div 
                className="absolute right-2 bottom-[-8px] text-[13px] font-medium leading-none px-1.5 py-0.5 rounded-[6px] text-white/90 border border-white/25 z-10"
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, '0')}
              </div>
            )}
          </div>
        ) : (
          /* Original portrait meta */
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
        )}
      </div>
    </button>
  );
});

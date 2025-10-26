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
        className="relative bg-black"
        style={{ 
          width: '100%',
          maxWidth: '100%',
          height: height ? `${height}px` : undefined,
          aspectRatio: isLandscape ? '16/11.592' : (!height ? '9/16' : undefined),
          boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 6px 16px rgba(0,0,0,0.06)',
          borderRadius: '0',
          overflow: isLandscape ? 'visible' : 'hidden'
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
          /* Dark glass overlay metadata card for landscape videos */
          <div className="absolute bottom-4 right-4 pointer-events-none" style={{ overflow: 'visible' }}>
            {/* Glass panel - content-width, right-anchored */}
            <div 
              className="relative z-10 flex flex-col rounded-[11px] px-4 py-3 max-w-[60vw] transition-transform duration-200 group-hover:scale-[1.02]"
              style={{
                background: 'rgba(20, 20, 20, 0.55)',
                backdropFilter: 'blur(12px) saturate(160%)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 1px 0 rgba(255, 255, 255, 0.4) inset',
                overflow: 'visible'
              }}
            >
              {/* Creator name */}
              <div 
                className="font-medium text-[14px] leading-tight"
                style={{ color: 'rgba(255, 255, 255, 0.92)' }}
              >
                {item.user?.name || 'Unknown'}
              </div>
              
              {/* Divider line */}
              <div 
                className="w-full h-[1px] my-1"
                style={{ background: 'rgba(255, 255, 255, 0.28)' }}
              />
              
              {/* Like count */}
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.75)' }} />
                <span 
                  className="text-[14px] font-normal"
                  style={{ color: 'rgba(255, 255, 255, 0.75)' }}
                >
                  {item.likes || 0} likes
                </span>
              </div>

              {/* Squircle profile thumbnail - overlapping top-right of glass panel */}
              <div 
                className="absolute -top-6 -right-2 z-20"
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))'
                }}
              >
                <Squircle width={48} height={48}>
                  <img
                    src={item.user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                    alt={item.user?.name || 'Unknown'}
                    className="w-full h-full object-cover"
                  />
                </Squircle>
                
                {/* Duration badge - below squircle */}
                {item.duration && typeof item.duration === 'number' && (
                  <div 
                    className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded px-1.5 py-0.5 text-white text-[12px] font-medium whitespace-nowrap"
                    style={{ 
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>
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

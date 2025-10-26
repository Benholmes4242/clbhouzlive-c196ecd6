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
          /* Dark glass overlay metadata card for landscape videos */
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pointer-events-none">
            <div 
              className="relative backdrop-blur-[12px] rounded-[6px] overflow-hidden transition-transform duration-200 group-hover:scale-[1.05]"
              style={{
                background: 'rgba(25, 25, 25, 0.6)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Metadata content */}
              <div className="px-4 pt-3 pb-3">
                {/* Username */}
                <div className="text-white font-medium text-[14px] leading-tight mb-2">
                  {item.user?.name || 'Unknown'}
                </div>
                
                {/* Divider line */}
                <div 
                  className="w-full h-[1px] mb-2"
                  style={{ background: 'rgba(255, 255, 255, 0.15)' }}
                />
                
                {/* Like count */}
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  <span 
                    className="text-[14px] font-normal"
                    style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {item.likes || 0} likes
                  </span>
                </div>
              </div>

              {/* Squircle profile thumbnail - overlapping top-right */}
              <div 
                className="absolute -top-4 right-3"
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))'
                }}
              >
                <Squircle width={56} height={56}>
                  <img
                    src={item.user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                    alt={item.user?.name || 'Unknown'}
                    className="w-full h-full object-cover"
                  />
                </Squircle>
              </div>
            </div>

            {/* Duration badge - below squircle, right-aligned */}
            {item.duration && typeof item.duration === 'number' && (
              <div 
                className="absolute -bottom-[22px] right-3 rounded px-2 py-1 text-white text-[12px] font-medium"
                style={{ background: 'rgba(0, 0, 0, 0.6)' }}
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

import React, { useEffect, useRef } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Flame } from 'lucide-react';
import { formatLikes } from '@/utils/dateFormat';
import { useInView } from 'react-intersection-observer';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface ShortsInlineBlockProps {
  shorts: ExploreContentItem[];
  onShortClick: (short: ExploreContentItem, index: number) => void;
  blockId: string;
}

// Deterministic height variance based on item ID
function getHeightVariant(id: string): number {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variance = (hash % 21) - 10; // -10% to +10%
  return 280 + (280 * variance / 100);
}

const ShortsInlineBlock: React.FC<ShortsInlineBlockProps> = ({ shorts, onShortClick, blockId }) => {
  const { ref: blockRef, inView } = useInView({ threshold: 0.3, triggerOnce: true });

  // Track block impression
  useEffect(() => {
    if (inView) {
      analyticsEvents.track('shorts_block_impression', { blockId, count: shorts.length });
    }
  }, [inView, blockId, shorts.length]);

  if (shorts.length !== 2) {
    console.warn('ShortsInlineBlock expects exactly 2 shorts');
    return null;
  }

  return (
    <div ref={blockRef} className="w-full mt-4 mb-5 px-1" aria-label="Trending shorts">
      <div className="grid grid-cols-2 gap-1">
        {shorts.map((short, index) => {
          const height = getHeightVariant(short.id);
          
          return (
            <ShortTile
              key={short.id}
              short={short}
              height={height}
              onClick={() => {
                analyticsEvents.track('shorts_tile_opened', { 
                  shortId: short.id, 
                  blockId,
                  position: index 
                });
                onShortClick(short, index);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

interface ShortTileProps {
  short: ExploreContentItem;
  height: number;
  onClick: () => void;
}

const ShortTile: React.FC<ShortTileProps> = ({ short, height, onClick }) => {
  const { ref: tileRef, inView } = useInView({ threshold: 0.3, triggerOnce: false });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle tile impression analytics
  useEffect(() => {
    if (inView) {
      analyticsEvents.track('shorts_tile_impression', { shortId: short.id });
    }
  }, [inView, short.id]);

  // Handle autoplay based on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (inView) {
      video.play().catch((err) => {
        console.info('Autoplay prevented:', err);
      });
    } else {
      video.pause();
    }
  }, [inView]);

  return (
    <div ref={tileRef} className="flex flex-col">
      {/* Tile Container */}
      <button
        onClick={onClick}
        className="relative overflow-hidden group w-full flex-shrink-0"
        style={{ 
          height: `${height}px`,
          aspectRatio: '9/16',
          boxShadow: '0 1px 2px rgba(0,0,0,.08), 0 6px 16px rgba(0,0,0,.06)',
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
        aria-label={`Watch short: ${short.title}`}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={short.src}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted
          playsInline
          poster={short.thumbnailSrc}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Trending Badge - Top Right */}
        <div 
          className="absolute top-1.5 right-1.5 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm z-10"
          style={{
            background: 'rgba(0,0,0,.6)',
            border: '1px solid rgba(255,255,255,.12)'
          }}
        >
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-[12px] font-semibold text-white">Trending</span>
        </div>
      </button>

      {/* Caption - Below Tile */}
      <div className="mt-1.5 px-1">
        {/* Title */}
        <h3 className="text-[15px] font-semibold line-clamp-1 overflow-hidden text-ellipsis whitespace-nowrap text-foreground">
          {short.title}
        </h3>

        {/* Meta Row */}
        <div className="mt-0.5 flex items-center justify-between gap-2 text-[13px] text-muted-foreground">
          {/* Left: Avatar + Creator Name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {short.user && (
              <>
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarImage 
                    src={short.user.avatar} 
                    alt={short.user.name} 
                  />
                  <AvatarFallback className="text-[11px]">
                    {short.user.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">
                  {short.user.name}
                </span>
              </>
            )}
          </div>

          {/* Right: Likes */}
          {short.likes !== undefined && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Heart className="w-3.5 h-3.5" />
              <span className="tabular-nums">{formatLikes(short.likes)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShortsInlineBlock;

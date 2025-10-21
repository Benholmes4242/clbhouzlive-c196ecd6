import React, { useEffect, useRef, useState } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Flame } from 'lucide-react';
import { formatLikes } from '@/utils/dateFormat';
import { useInView } from 'react-intersection-observer';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(short.likes || 0);

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

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    toast.success(isLiked ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (short.user?.username) {
      navigate(`/profile/${short.user.username}`);
    }
  };

  return (
    <div ref={tileRef} className="flex flex-col">
      {/* Tile Container */}
      <button
        onClick={onClick}
        className="relative overflow-hidden rounded-xl group w-full flex-shrink-0"
        style={{ 
          height: `${height}px`,
          aspectRatio: '9/16',
          boxShadow: '0 1px 2px rgba(0,0,0,.08), 0 6px 16px rgba(0,0,0,.06)'
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

      {/* Creator-First Meta - Below Tile */}
      <div className="mt-2 px-1">
        {/* Row 1: Avatar + Username | Likes */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Avatar + Username */}
          {short.user && (
            <button
              onClick={handleAuthorClick}
              className="flex items-center gap-2 min-w-0 flex-1 group"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <Avatar 
                className="w-7 h-7 flex-shrink-0 ring-1 ring-[#6E9277]/30"
                style={{ width: '28px', height: '28px' }}
              >
                <AvatarImage 
                  src={short.user.avatar} 
                  alt={short.user.name} 
                />
                <AvatarFallback className="text-[11px] bg-primary/10">
                  {short.user.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span 
                className="font-semibold truncate transition-all group-hover:underline"
                style={{ 
                  color: '#6E9277',
                  fontSize: '14px',
                  maxWidth: '60%'
                }}
              >
                {short.user.name}
              </span>
            </button>
          )}

          {/* Right: Like Button */}
          <button
            onClick={handleLikeToggle}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-transform active:scale-95 hover:bg-black/5"
            style={{ minWidth: '44px', minHeight: '32px' }}
            aria-label={`${isLiked ? 'Unlike' : 'Like'} post by ${short.user?.name}, ${likeCount} likes`}
          >
            <Heart 
              className={`w-[18px] h-[18px] transition-all ${isLiked ? 'fill-[#6E9277] stroke-[#6E9277]' : 'stroke-muted-foreground'}`}
              style={{ 
                strokeWidth: isLiked ? 0 : 2,
                animation: isLiked ? 'like-pop 0.12s ease-out' : 'none'
              }}
            />
            <span 
              className="text-[13px] font-medium tabular-nums"
              style={{ color: 'rgba(0,0,0,0.55)' }}
            >
              {formatLikes(likeCount)}
            </span>
          </button>
        </div>

        {/* Row 2: Caption with gradient fade */}
        <div className="mt-1.5 relative">
          <p 
            className="text-[13px] leading-[1.25] line-clamp-2"
            style={{ 
              color: 'rgba(0,0,0,0.82)',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden'
            }}
          >
            {short.title}
          </p>
          <div 
            className="absolute right-0 bottom-0 pointer-events-none"
            style={{
              width: '36%',
              height: '1.2em',
              background: 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1))'
            }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes like-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ShortsInlineBlock;

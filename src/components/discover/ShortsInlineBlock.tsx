/**
 * ShortsInlineBlock - Inline shorts block for discover feed
 * 
 * TIKTOK-LEVEL IMPLEMENTATION:
 * - Direct UnifiedVideoPlayer (no legacy wrapper)
 * - 50%/10% hysteresis autoplay via IntersectionObserver
 * - 150ms crossfade poster→video transition
 * - Priority poster loading
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { Squircle } from '@/components/ui/squircle';
import { Heart, Flame } from 'lucide-react';
import { formatLikes } from '@/utils/dateFormat';
import { buildImageThumbnailUrl, buildVideoPosterUrl } from '@/utils/mediaThumbs';
import { useInView } from 'react-intersection-observer';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { cn } from '@/lib/utils';

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
              sortIndex={index}
              isPriority={index < 2} // Both tiles are priority
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
  sortIndex: number;
  onClick: () => void;
  isPriority?: boolean;
}

const ShortTile: React.FC<ShortTileProps> = ({ short, height, sortIndex, onClick, isPriority = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  
  // P0: Hysteresis-based autoplay state (50% start, 10% stop)
  const [shouldPlay, setShouldPlay] = useState(false);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);

  // Extract stream UID and generate URLs
  const streamId = short.src ? uidFromNode({ src: short.src }) : null;
  const hlsUrl = streamId ? generateStreamHlsUrl(streamId) : short.src;
  const posterUrl = short.thumbnailSrc 
    ? buildVideoPosterUrl(short.thumbnailSrc, { width: 600, height: 600 })
    : streamId 
      ? generateStreamThumbnailUrl(streamId, { height: 600, fit: 'cover' })
      : '';

  // Reset state when short changes
  useEffect(() => {
    setHasFirstFrame(false);
    setShouldPlay(false);
  }, [short.id]);

  // ============================================================================
  // P0: HYSTERESIS AUTOPLAY - 50% to start, 10% to stop
  // ============================================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hlsUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        
        const ratio = entry.intersectionRatio;
        
        setShouldPlay(prev => {
          // Start playing at 50% visibility
          if (!prev && ratio >= 0.5) {
            return true;
          }
          // Stop playing when below 10% visibility
          if (prev && ratio < 0.1) {
            return false;
          }
          return prev;
        });
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
        rootMargin: '0px',
      }
    );

    observer.observe(container);
    
    return () => {
      observer.disconnect();
    };
  }, [hlsUrl]);

  // Control playback based on hysteresis state
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay]);

  // Handle first frame loaded
  const handleLoadedData = useCallback(() => {
    setHasFirstFrame(true);
  }, []);

  // Track tile impression
  useEffect(() => {
    if (shouldPlay) {
      analyticsEvents.track('shorts_tile_impression', { shortId: short.id });
    }
  }, [shouldPlay, short.id]);

  return (
    <div className="flex flex-col">
      {/* Tile Container */}
      <div
        ref={containerRef}
        onClick={onClick}
        className={cn(
          "relative overflow-hidden rounded-xl group w-full flex-shrink-0 cursor-pointer",
          "will-change-transform" // P3: GPU acceleration
        )}
        style={{ 
          height: `${height}px`,
          aspectRatio: '9/16',
          boxShadow: '0 1px 2px rgba(0,0,0,.08), 0 6px 16px rgba(0,0,0,.06)'
        }}
        aria-label={`Watch short: ${short.title}`}
        aria-busy={!hasFirstFrame}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      >
        {/* P1: Priority Poster with fetchPriority="high" */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className={cn(
              "absolute inset-0 w-full h-full object-cover z-10",
              "transition-opacity duration-150 ease-out",
              hasFirstFrame && shouldPlay ? "opacity-0" : "opacity-100"
            )}
            loading={isPriority ? "eager" : "lazy"}
            fetchPriority={isPriority ? "high" : "auto"}
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.onerror = null;
            }}
          />
        )}

        {/* TIKTOK-LEVEL: Direct UnifiedVideoPlayer with hysteresis control */}
        {hlsUrl && (
          <div className={cn(
            "absolute inset-0",
            "transition-opacity duration-150 ease-out",
            hasFirstFrame ? "opacity-100" : "opacity-0"
          )}>
            <UnifiedVideoPlayer
              ref={playerRef}
              src={hlsUrl}
              posterUrl={posterUrl}
              autoplay={false} // Controlled via hysteresis
              muted
              loop
              showMuteButton={false}
              showPlayButton={false}
              objectFit="cover"
              className="absolute inset-0 w-full h-full"
              surface="grid"
              managedByMediaRuntime={false}
              mediaId={streamId || short.id}
              preload="auto"
              onLoadedData={handleLoadedData}
            />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none z-20" />

        {/* Trending Badge - Top Right */}
        <div 
          className="absolute top-1.5 right-1.5 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm z-30"
          style={{
            background: 'rgba(0,0,0,.6)',
            border: '1px solid rgba(255,255,255,.12)'
          }}
        >
          <Flame className="w-3 h-3 text-slate-400" />
          <span className="text-[12px] font-semibold text-white">Trending</span>
        </div>
      </div>

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
                <Squircle width={24} height={24}>
                  {short.user.avatar ? (
                    <img 
                      src={buildImageThumbnailUrl(short.user.avatar, { width: 128, height: 128 })}
                      alt={short.user.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar.svg';
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '10px', fontWeight: 600 }}>
                      {short.user.name[0].toUpperCase()}
                    </div>
                  )}
                </Squircle>
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

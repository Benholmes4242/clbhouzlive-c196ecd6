import React, { useEffect, useRef } from 'react';
import { ShortVideo } from '@/hooks/useInfiniteShortsVideos';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { Play, Eye } from 'lucide-react';
import type { RegisterMediaFn } from '@/media';

interface CreatorShortsGridProps {
  shorts: ShortVideo[];
  onShortClick: (shortId: string) => void;
  registerMedia?: RegisterMediaFn;
  playingIds?: Set<string>;
}

/**
 * Grid display for shorts on Creator Page
 * 3-column grid with 9:16 aspect ratio tiles
 */
export const CreatorShortsGrid: React.FC<CreatorShortsGridProps> = ({
  shorts,
  onShortClick,
  registerMedia,
  playingIds,
}) => {
  const formatViews = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="grid grid-cols-3 gap-1">
      {shorts.map((short, index) => (
        <ShortTile
          key={short.id}
          short={short}
          index={index}
          onClick={() => onShortClick(short.id)}
          registerMedia={registerMedia}
          isPlaying={playingIds?.has(short.id) ?? false}
          formatViews={formatViews}
        />
      ))}
    </div>
  );
};

interface ShortTileProps {
  short: ShortVideo;
  index: number;
  onClick: () => void;
  registerMedia?: RegisterMediaFn;
  isPlaying: boolean;
  formatViews: (count: number) => string;
}

const ShortTile: React.FC<ShortTileProps> = ({
  short,
  index,
  onClick,
  registerMedia,
  isPlaying,
  formatViews,
}) => {
  const containerRef = useRef<HTMLButtonElement>(null);
  const playerRef = useRef<HLSPlayerRef>(null);

  // Generate HLS URL
  const uid = short.mediaUrl ? uidFromNode({ media_url: short.mediaUrl }) : null;
  const hlsUrl = uid ? generateStreamHlsUrl(uid) : null;

  // Register with MediaRuntime for autoplay
  useEffect(() => {
    if (!registerMedia || !hlsUrl) return;
    
    const video = playerRef.current?.getElement();
    if (!video) return;

    registerMedia({
      id: short.id,
      element: video,
      isCandidate: true,
      sortIndex: index,
      observeTarget: containerRef.current,
    });

    return () => {
      registerMedia({ id: short.id, element: null });
    };
  }, [short.id, index, registerMedia, hlsUrl]);

  return (
    <button
      ref={containerRef}
      onClick={onClick}
      className="group relative aspect-[9/16] overflow-hidden bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform duration-75 active:scale-[0.98]"
      aria-label={`Play short by ${short.creatorName}`}
    >
      {/* Video/Thumbnail */}
      {hlsUrl ? (
        <HLSPlayer
          ref={playerRef}
          src={hlsUrl}
          autoplay={isPlaying}
          muted
          loop
          showMuteButton={false}
          showPlayButton={false}
          objectFit="cover"
          className="absolute inset-0 w-full h-full"
        />
      ) : short.thumbnailUrl ? (
        <img
          src={short.thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <Play className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />

      {/* Duration badge */}
      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-medium text-white">
        {short.duration}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center gap-1 text-white/80 text-[11px]">
          <Eye className="w-3 h-3" />
          <span>{formatViews(short.views)}</span>
        </div>
      </div>
    </button>
  );
};

export default CreatorShortsGrid;

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ActivityMediaItem } from './types';
import { useMediaStatus } from './useMediaStatus';
import { Play, Images, Trophy } from 'lucide-react';

interface HeroPostTileProps {
  item: ActivityMediaItem;
  onPress?: (postId: string) => void;
}

/**
 * Full-width hero tile for standout posts
 * Cinematic 16:9 aspect, spans both columns
 */
const HeroPostTile: React.FC<HeroPostTileProps> = ({ item, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const { status, onLoad, onError } = useMediaStatus(item.url);
  
  const handleClick = useCallback(() => {
    onPress?.(item.postId);
  }, [item.postId, onPress]);

  const handleError = useCallback(() => {
    setImageError(true);
    onError();
  }, [onError]);

  return (
    <button
      type="button"
      className={cn(
        "col-span-2",
        "aspect-[16/9]",
        "relative overflow-hidden",
        "active:scale-[0.98] transition-transform duration-150",
        "bg-muted/20"
      )}
      onClick={handleClick}
    >
      {/* Media */}
      {!imageError ? (
        <img
          src={item.thumbnailUrl || item.url}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          onLoad={onLoad}
          onError={handleError}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted/30">
          <span className="text-muted-foreground text-sm">Unable to load</span>
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

      {/* Video indicator */}
      {item.type === 'video' && (
        <div className="absolute bottom-3 right-3 flex items-center justify-center h-8 w-8 rounded-full bg-black/60">
          <Play className="h-4 w-4 text-white fill-white" />
        </div>
      )}

      {/* Multi-media indicator */}
      {item.additionalMediaCount && item.additionalMediaCount > 0 && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 text-white text-xs font-medium">
          <Images className="h-3 w-3" />
          <span>+{item.additionalMediaCount}</span>
        </div>
      )}

      {/* Milestone indicator */}
      {item.isMilestone && (
        <div className="absolute top-3 left-3 flex items-center justify-center h-6 w-6 rounded-full bg-black/50">
          <Trophy className="h-3 w-3 text-amber-400" />
        </div>
      )}

      {/* Course name label */}
      {item.courseName && (
        <div className="absolute inset-x-3 bottom-3 flex justify-start">
          <span className="inline-flex max-w-[75%] items-center px-3 py-1 text-xs font-medium text-white bg-black/55 backdrop-blur-sm rounded-full truncate">
            {item.courseName}
          </span>
        </div>
      )}
    </button>
  );
};

export default HeroPostTile;

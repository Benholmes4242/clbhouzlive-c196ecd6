import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ActivityMediaItem } from './types';
import { useMediaStatus } from './useMediaStatus';
import { Play, Images, Trophy } from 'lucide-react';

interface StandardPostTileProps {
  item: ActivityMediaItem;
  onPress?: (postId: string) => void;
}

/**
 * Standard tile for two-column waterfall grid
 * Square aspect with pointed corners
 */
const StandardPostTile: React.FC<StandardPostTileProps> = ({ item, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const { status, onLoad, onError } = useMediaStatus(item.url);
  
  const handleClick = useCallback(() => {
    onPress?.(item.postId);
  }, [item.postId, onPress]);

  const handleError = useCallback(() => {
    setImageError(true);
    onError();
  }, [onError]);

  // Determine aspect ratio based on media type
  const aspectClass = item.aspectRatio === 'portrait' 
    ? 'aspect-[3/4]' 
    : 'aspect-square';

  return (
    <button
      type="button"
      className={cn(
        aspectClass,
        "relative overflow-hidden",
        "active:scale-[0.97] transition-transform duration-150",
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
          <span className="text-muted-foreground text-xs">Unable to load</span>
        </div>
      )}

      {/* Video indicator */}
      {item.type === 'video' && (
        <div className="absolute bottom-2 right-2 flex items-center justify-center h-6 w-6 rounded-full bg-black/60">
          <Play className="h-3 w-3 text-white fill-white" />
        </div>
      )}

      {/* Multi-media indicator */}
      {item.additionalMediaCount && item.additionalMediaCount > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-medium">
          <Images className="h-2.5 w-2.5" />
          <span>+{item.additionalMediaCount}</span>
        </div>
      )}

      {/* Milestone indicator */}
      {item.isMilestone && (
        <div className="absolute top-2 left-2 flex items-center justify-center h-5 w-5 rounded-full bg-black/50">
          <Trophy className="h-2.5 w-2.5 text-amber-400" />
        </div>
      )}

      {/* Course name label */}
      {item.courseName && (
        <div className="absolute left-2 bottom-2">
          <span className="inline-flex max-w-[90%] items-center px-2 py-[2px] rounded-full bg-black/55 text-[10px] text-white truncate">
            {item.courseName}
          </span>
        </div>
      )}
    </button>
  );
};

export default StandardPostTile;

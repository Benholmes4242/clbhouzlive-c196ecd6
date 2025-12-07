import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ActivityMediaItem } from './types';
import PostMedia from './PostMedia';
import { Images, Trophy } from 'lucide-react';

interface StandardPostTileProps {
  item: ActivityMediaItem;
  onPress?: (postId: string) => void;
}

/**
 * Standard tile for two-column waterfall grid
 * Square aspect with pointed corners
 */
const StandardPostTile: React.FC<StandardPostTileProps> = ({ item, onPress }) => {
  const handleClick = useCallback(() => {
    onPress?.(item.postId);
  }, [item.postId, onPress]);

  const isVideo = item.type === 'video';
  
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
        "active:scale-[0.97] transition-transform duration-150"
      )}
      onClick={handleClick}
    >
      {/* Media with skeleton loading */}
      <PostMedia
        thumbnailUrl={item.thumbnailUrl || item.url}
        title={item.courseName}
        isVideo={isVideo}
      />

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

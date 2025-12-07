import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ActivityMediaItem } from './types';
import PostMedia from './PostMedia';
import { Images, Trophy } from 'lucide-react';

interface HeroPostTileProps {
  item: ActivityMediaItem;
  onPress?: (postId: string) => void;
}

/**
 * Full-width hero tile for standout posts
 * Cinematic 16:9 aspect, spans both columns
 */
const HeroPostTile: React.FC<HeroPostTileProps> = ({ item, onPress }) => {
  const handleClick = useCallback(() => {
    onPress?.(item.postId);
  }, [item.postId, onPress]);

  const isVideo = item.type === 'video';

  return (
    <button
      type="button"
      className={cn(
        "col-span-2",
        "aspect-[16/9]",
        "relative overflow-hidden",
        "active:scale-[0.98] transition-transform duration-150"
      )}
      onClick={handleClick}
    >
      {/* Media with skeleton loading */}
      <PostMedia
        thumbnailUrl={item.thumbnailUrl || item.url}
        title={item.courseName}
        isVideo={isVideo}
      />

      {/* Bottom gradient overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

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

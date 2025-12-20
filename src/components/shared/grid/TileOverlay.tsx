import React from 'react';
import { Heart } from 'lucide-react';
import DurationBadge from '@/components/shared/DurationBadge';

interface TileOverlayProps {
  // Creator info
  creatorName?: string;
  creatorAvatar?: string;
  
  // Likes
  likes?: number;
  
  // Duration (in seconds)
  durationSeconds?: number | null;
  
  // Config
  showCreator: boolean;
  showLikes: boolean;
  showDuration?: boolean;
  showAvatar?: boolean;
  
  // Variant
  variant?: 'portrait' | 'landscape';
  
  // Handlers
  onAuthorClick?: () => void;
}

/**
 * Shared overlay component for media tiles
 * 
 * Layout zones:
 * - Top-right: Duration badge (using shared DurationBadge component)
 * - Bottom-left (stacked): Creator name, Like count
 * - Bottom-right: Creator avatar squircle
 * 
 * Consistent styling across Watch and Profile grids
 * No play icon - video is implied in Watch/Shorts context
 */
const TileOverlay: React.FC<TileOverlayProps> = ({
  creatorName,
  creatorAvatar,
  likes,
  durationSeconds,
  showCreator,
  showLikes,
  showDuration = true,
  showAvatar = true,
  variant = 'portrait',
  onAuthorClick,
}) => {
  const hasValidDuration = typeof durationSeconds === 'number' && Number.isFinite(durationSeconds) && durationSeconds > 0;
  
  const handleAuthorClick = (e: React.MouseEvent) => {
    if (onAuthorClick) {
      e.stopPropagation();
      onAuthorClick();
    }
  };

  const hasBottomContent = (showCreator && creatorName) || showLikes;
  const hasTopContent = showDuration && hasValidDuration;
  
  if (!hasBottomContent && !hasTopContent) {
    return null;
  }

  return (
    <>
      {/* Duration badge - top right (using shared component) */}
      {showDuration && hasValidDuration && (
        <div className="absolute top-2 right-2 z-20">
          <DurationBadge durationSeconds={durationSeconds} size="sm" />
        </div>
      )}

      {/* Bottom overlay zone */}
      <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
        {/* Bottom-left: Creator name + Like count (stacked) */}
        {hasBottomContent && (
          <div className="absolute left-3 bottom-3 flex flex-col gap-1 max-w-[calc(100%-80px)]">
            {showCreator && creatorName && (
              <button
                type="button"
                className="text-white font-semibold text-sm leading-tight truncate block pointer-events-auto hover:underline text-left"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                onClick={handleAuthorClick}
              >
                {creatorName}
              </button>
            )}
            
            {showLikes && (
              <div 
                className="flex items-center gap-1 text-white/70 text-[10px] leading-none font-medium"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
              >
                <Heart className="w-3 h-3" />
                <span>{likes ?? 0}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Bottom-right: Avatar squircle */}
        {showCreator && showAvatar && creatorAvatar && (
          <button
            type="button"
            className="absolute right-3 bottom-3 w-9 h-9 rounded-[8px] overflow-hidden border border-white/30 bg-black/40 backdrop-blur-sm pointer-events-auto shadow-lg"
            onClick={handleAuthorClick}
          >
            <img
              src={creatorAvatar}
              alt={creatorName || 'Creator'}
              className="w-full h-full object-cover"
            />
          </button>
        )}
      </div>
    </>
  );
};

export default TileOverlay;

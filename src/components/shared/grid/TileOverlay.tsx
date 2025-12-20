import React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TileOverlayProps {
  // Creator info
  creatorName?: string;
  creatorAvatar?: string;
  
  // Likes
  likes?: number;
  
  // Config
  showCreator: boolean;
  showLikes: boolean;
  
  // Variant
  variant?: 'portrait' | 'landscape';
  
  // Handlers
  onAuthorClick?: () => void;
}

/**
 * Shared overlay component for media tiles
 * Handles creator label and like count display
 * Consistent styling across Watch and Profile grids
 */
const TileOverlay: React.FC<TileOverlayProps> = ({
  creatorName,
  creatorAvatar,
  likes,
  showCreator,
  showLikes,
  variant = 'portrait',
  onAuthorClick,
}) => {
  const isLandscape = variant === 'landscape';
  
  if (!showCreator && !showLikes) {
    return null;
  }

  const handleAuthorClick = (e: React.MouseEvent) => {
    if (onAuthorClick) {
      e.stopPropagation();
      onAuthorClick();
    }
  };

  if (isLandscape) {
    // Landscape: Glass panel style on the right
    return (
      <div className="absolute bottom-2 right-0 z-10 pointer-events-none">
        <div className="flex flex-col min-w-[160px] max-w-[220px] px-3 py-1.5 rounded-l-xl bg-black/40 backdrop-blur-md border border-white/10 border-r-0">
          {showCreator && creatorName && (
            <button
              type="button"
              className="text-white font-semibold text-sm leading-tight flex items-center gap-2 truncate pointer-events-auto hover:underline text-left"
              onClick={handleAuthorClick}
            >
              {creatorName}
            </button>
          )}
          
          {showCreator && showLikes && (
            <div className="mt-1 mb-1 h-px w-full bg-white/20" />
          )}
          
          {showLikes && (
            <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-normal leading-snug">
              <Heart className="w-3 h-3" />
              <span>{likes ?? 0}</span>
            </div>
          )}
        </div>
        
        {/* Avatar */}
        {showCreator && creatorAvatar && (
          <button
            type="button"
            className="absolute right-2 bottom-2 w-10 h-10 rounded-[10px] overflow-hidden border border-white/30 bg-black/40 backdrop-blur-md pointer-events-auto"
            style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)' }}
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
    );
  }

  // Portrait: Text bottom-left, avatar bottom-right
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
      {/* Text content - bottom left */}
      <div className="absolute left-3 bottom-3 flex flex-col gap-1 max-w-[calc(100%-80px)]">
        {showCreator && creatorName && (
          <button
            type="button"
            className="text-white font-bold text-sm leading-tight truncate block pointer-events-auto hover:underline text-left"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
            onClick={handleAuthorClick}
          >
            {creatorName}
          </button>
        )}
        
        {showLikes && (
          <div 
            className="flex items-center gap-1 text-white/60 text-[10px] leading-none font-normal"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
          >
            <Heart className="w-3 h-3" />
            <span>{likes ?? 0}</span>
          </div>
        )}
      </div>
      
      {/* Avatar - bottom right */}
      {showCreator && creatorAvatar && (
        <button
          type="button"
          className="absolute right-3 bottom-3 w-10 h-10 rounded-[10px] overflow-hidden border border-white/30 bg-black/40 backdrop-blur-md pointer-events-auto"
          style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)' }}
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
  );
};

export default TileOverlay;

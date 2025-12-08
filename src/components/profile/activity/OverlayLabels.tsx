import React from 'react';
import { Play, Trophy, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverlayLabelsProps {
  courseName?: string;
  isVideo: boolean;
  additionalMediaCount?: number;
  isMilestone?: boolean;
  isHovered?: boolean;
}

/**
 * Premium overlay labels for media cards
 * Displays course name, video indicator, multi-count badge, and milestone icon
 */
const OverlayLabels: React.FC<OverlayLabelsProps> = ({
  courseName,
  isVideo,
  additionalMediaCount = 0,
  isMilestone,
  isHovered
}) => {
  return (
    <>
      {/* Gradient overlay for label legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
      
      {/* Course name - bottom left */}
      {courseName && (
        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center">
          <span className={cn(
            "truncate rounded-sq-pill bg-black/45 backdrop-blur-sm",
            "px-2.5 py-1 text-[11px] font-medium text-white/95",
            "max-w-[85%]"
          )}>
            {courseName}
          </span>
        </div>
      )}
      
      {/* Video indicator - bottom right (only when not hovered/playing) */}
      {isVideo && !isHovered && (
        <div className="pointer-events-none absolute bottom-2 right-2 flex items-center">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-sq-pill",
            "bg-black/50 backdrop-blur-sm"
          )}>
            <Play className="h-3.5 w-3.5 fill-white text-white ml-0.5" />
          </div>
        </div>
      )}
      
      {/* Multi-asset indicator - top right */}
      {additionalMediaCount > 0 && (
        <div className="pointer-events-none absolute top-2 right-2">
          <div className={cn(
            "flex items-center gap-1 rounded-sq-pill",
            "bg-black/50 backdrop-blur-sm",
            "px-2 py-0.5 text-[10px] font-semibold text-white"
          )}>
            <Layers className="h-3 w-3" />
            <span>+{additionalMediaCount}</span>
          </div>
        </div>
      )}
      
      {/* Milestone indicator - top left */}
      {isMilestone && (
        <div className="pointer-events-none absolute left-2 top-2">
          <div className={cn(
            "flex h-6 w-6 items-center justify-center rounded-sq-pill",
            "bg-black/45 backdrop-blur-sm"
          )}>
            <Trophy className="h-3 w-3 text-amber-400" />
          </div>
        </div>
      )}
    </>
  );
};

export default OverlayLabels;

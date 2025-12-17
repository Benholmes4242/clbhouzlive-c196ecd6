import React from 'react';
import { formatDuration } from '@/utils/formatDuration';
import { cn } from '@/lib/utils';
import { Play, Pause } from 'lucide-react';

interface VideoOverlayProps {
  durationSeconds?: number | null;
  isPlaying?: boolean;
}

/**
 * Video overlay with play/pause icon, duration badge, and gradient strip
 * Used on both HeroPostTile and StandardPostTile for video content
 */
const VideoOverlay: React.FC<VideoOverlayProps> = ({ durationSeconds, isPlaying = false }) => {
  const durationLabel = durationSeconds && durationSeconds > 0 ? formatDuration(durationSeconds) : '';

  return (
    <>
      {/* Bottom gradient strip for readability */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-slate-900/45 to-transparent" />

      {/* Duration pill - bottom left */}
      {durationLabel ? (
        <div className="pointer-events-none absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-slate-900/85 px-2 py-1 shadow-sm">
          <span className="text-[10px] leading-none font-medium text-white">
            {durationLabel}
          </span>
        </div>
      ) : null}

      {/* Play/pause icon chip - bottom right */}
      <div 
        className={cn(
          "pointer-events-none absolute bottom-1.5 right-1.5 flex items-center justify-center",
          "h-6 w-6 rounded-full bg-slate-900/85 shadow-sm",
          isPlaying && "ring-2 ring-white/30"
        )}
      >
        {isPlaying ? (
          <Pause className="h-3 w-3 text-white fill-white" />
        ) : (
          <Play className="h-3 w-3 text-white fill-white ml-0.5" />
        )}
      </div>
    </>
  );
};

export default VideoOverlay;

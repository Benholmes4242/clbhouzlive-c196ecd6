import React, { useState } from 'react';
import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioStripProps {
  audioTrack: {
    title?: string;
    name?: string;
    artist?: string;
    isOriginal?: boolean;
  };
  className?: string;
}

export const AudioStrip: React.FC<AudioStripProps> = ({ audioTrack, className }: AudioStripProps) => {
  const [isPaused, setIsPaused] = useState(false);
  
  if (!audioTrack) return null;
  
  const trackName = audioTrack.title || audioTrack.name || 'Unknown Track';
  const displayText = audioTrack.artist 
    ? `${trackName} • ${audioTrack.artist}`
    : trackName;

  const handleClick = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-2 max-w-[280px]",
        "bg-hud-bg backdrop-blur-md border border-hud-border",
        "text-white cursor-pointer transition-all duration-200",
        "hover:bg-hud-bg/80",
        className
      )}
      onClick={handleClick}
    >
      <Music className="w-4 h-4 flex-shrink-0" />
      <div className="overflow-hidden min-w-0">
        <div 
          className={cn(
            "text-sm font-medium whitespace-nowrap",
            !isPaused && displayText.length > 25 && "animate-marquee"
          )}
          style={{
            animationDuration: `${Math.max(displayText.length * 0.2, 3)}s`
          }}
        >
          {displayText}
        </div>
      </div>
    </div>
  );
};
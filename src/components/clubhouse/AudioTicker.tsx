import React from 'react';
import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioTickerProps {
  track: string;
  className?: string;
}

const AudioTicker = ({ track, className }: AudioTickerProps) => {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full px-3 h-8",
      "bg-[hsl(var(--hud-bg))] border border-[hsl(var(--hud-border))]",
      "backdrop-blur-md shadow-[var(--hud-shadow)]",
      className
    )}>
      <Music className="w-4 h-4 text-white" />
      <div className="overflow-hidden max-w-[60vw] md:max-w-[30vw]">
        <div 
          className="inline-block whitespace-nowrap pr-8 text-white text-sm font-medium"
          style={{ animation: 'marquee 12s linear infinite' }}
        >
          {track} • {track}
        </div>
      </div>
    </div>
  );
};

export default AudioTicker;
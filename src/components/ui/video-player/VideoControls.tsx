import React from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoControlsProps {
  isPlaying: boolean;
  showControls: boolean;
  onTogglePlayPause: (e?: React.MouseEvent | Event) => void;
  show: boolean;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  showControls,
  onTogglePlayPause,
  show
}) => {
  if (!show) return null;

  return (
    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
      showControls ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Play/Pause Button */}
      <Button
        onClick={onTogglePlayPause}
        variant="ghost"
        size="icon"
        className="h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white border-0 backdrop-blur-sm"
      >
        {isPlaying ? (
          <Pause className="h-6 w-6" />
        ) : (
          <Play className="h-6 w-6 ml-0.5" />
        )}
      </Button>
    </div>
  );
};
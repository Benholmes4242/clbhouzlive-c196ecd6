import React from 'react';
import { Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoCornerControlsProps {
  isMuted: boolean;
  showControls: boolean;
  isInFeed: boolean;
  onToggleMute: (e: React.MouseEvent) => void;
  onFullscreen: (e: React.MouseEvent) => void;
  show: boolean;
  showMuteButton: boolean;
}

export const VideoCornerControls: React.FC<VideoCornerControlsProps> = ({
  isMuted,
  showControls,
  isInFeed,
  onToggleMute,
  onFullscreen,
  show,
  showMuteButton
}) => {
  if (!show || !showMuteButton) return null;

  return (
    <div className={`absolute top-2 left-2 flex space-x-2 transition-opacity ${
      showControls || isInFeed ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Mute Button - Always visible for feed videos */}
      <Button
        onClick={onToggleMute}
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white backdrop-blur-sm"
      >
        {isMuted ? (
          <VolumeX className="h-3 w-3" fill="currentColor" />
        ) : (
          <Volume2 className="h-3 w-3" fill="currentColor" />
        )}
      </Button>

      {/* Fullscreen Button - Only show on hover for non-feed videos */}
      {!isInFeed && (
        <Button
          onClick={onFullscreen}
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white backdrop-blur-sm"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
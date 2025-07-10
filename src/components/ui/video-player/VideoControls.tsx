import React from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  showControls: boolean;
  showOverlayControls: boolean;
  showMuteButton: boolean;
  isInFeed: boolean;
  onTogglePlayPause: (e?: React.MouseEvent | Event) => void;
  onToggleMute: (e: React.MouseEvent) => void;
  onFullscreen: (e: React.MouseEvent) => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  isMuted,
  showControls,
  showOverlayControls,
  showMuteButton,
  isInFeed,
  onTogglePlayPause,
  onToggleMute,
  onFullscreen
}) => {
  if (!showOverlayControls) return null;

  return (
    <>
      {/* Center Play/Pause Button */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
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

      {/* Corner Controls */}
      {showMuteButton && (
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
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
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
      )}
    </>
  );
};
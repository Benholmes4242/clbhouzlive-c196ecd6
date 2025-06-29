
import React from 'react';
import { Maximize2 } from 'lucide-react';

interface VideoControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  isHovered: boolean;
  onPlayPause: () => void;
}

const VideoControls = ({ isPlaying, isLoading, isHovered, onPlayPause }: VideoControlsProps) => {
  if (!isHovered) return null;

  return (
    <>
      {/* Controls overlay - only show enlarge button on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlayPause();
          }}
          className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors shadow-lg"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Gradient overlay for better button visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-15" />
    </>
  );
};

export default VideoControls;

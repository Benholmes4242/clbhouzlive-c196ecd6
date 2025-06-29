
import React from 'react';
import { Maximize2 } from 'lucide-react';

interface VideoControlsProps {
  isHovered: boolean;
  isGridThumbnail: boolean;
  onFullscreen?: () => void;
}

const VideoControls = ({ isHovered, isGridThumbnail, onFullscreen }: VideoControlsProps) => {
  if (isGridThumbnail || !isHovered) return null;

  return (
    <>
      {/* Controls overlay - only show enlarge button on hover and not in grid thumbnails */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFullscreen?.();
          }}
          className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors shadow-lg"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Gradient overlay for better button visibility - only in non-grid contexts */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-15" />
    </>
  );
};

export default VideoControls;

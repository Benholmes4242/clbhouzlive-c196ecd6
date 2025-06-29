
import React from 'react';
import GridVideoPreview from './video/GridVideoPreview';
import StandardVideoPreview from './video/StandardVideoPreview';
import { VideoPreviewProps } from './video/types';

const VideoPreview = ({ 
  src, 
  poster, 
  className = "", 
  onFullscreen, 
  videoId, 
  isGridThumbnail = false 
}: VideoPreviewProps) => {
  
  console.log('VideoPreview rendering:', {
    videoId,
    src,
    poster,
    isGridThumbnail,
    hasValidSrc: !!src && src.length > 0
  });

  // Check for invalid video src
  if (!src || src.trim() === '' || typeof src !== 'string') {
    console.log('Invalid video src:', { videoId, src, type: typeof src });
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-gray-500 text-sm">No video</div>
      </div>
    );
  }

  // Use appropriate component based on context
  if (isGridThumbnail) {
    return (
      <GridVideoPreview
        src={src}
        poster={poster}
        className={className}
        onFullscreen={onFullscreen}
        videoId={videoId}
      />
    );
  }

  return (
    <StandardVideoPreview
      src={src}
      poster={poster}
      className={className}
      onFullscreen={onFullscreen}
      videoId={videoId}
    />
  );
};

export default VideoPreview;

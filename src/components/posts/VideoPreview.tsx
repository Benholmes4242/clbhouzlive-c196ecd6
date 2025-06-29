
import React from 'react';
import GridVideoPreview from './video/GridVideoPreview';
import StandardVideoPreview from './video/StandardVideoPreview';

interface VideoPreviewProps {
  src: string;
  poster?: string;
  className?: string;
  videoId: string;
  isGridThumbnail?: boolean;
}

const VideoPreview = ({ 
  src, 
  poster, 
  className = "", 
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

  // Add error boundary for video components
  try {
    // Use appropriate component based on context
    if (isGridThumbnail) {
      return (
        <GridVideoPreview
          src={src}
          poster={poster}
          className={className}
          videoId={videoId}
        />
      );
    }

    return (
      <StandardVideoPreview
        src={src}
        poster={poster}
        className={className}
        videoId={videoId}
      />
    );
  } catch (error) {
    console.error('Error rendering VideoPreview:', error);
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Video unavailable</div>
      </div>
    );
  }
};

export default VideoPreview;

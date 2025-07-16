import React, { memo, forwardRef } from 'react';
import { useStableVideoRenderer } from '@/hooks/useStableMediaRenderer';

interface StableVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  fallbackComponent?: React.ReactNode;
}

const StableVideo = memo(forwardRef<HTMLVideoElement, StableVideoProps>(({
  src,
  fallbackComponent,
  className = '',
  ...props
}, externalRef) => {
  const { mediaId, isLoaded, elementRef, shouldRender, videoProps } = useStableVideoRenderer(src);

  // If media is already loaded and stable, render the cached version
  if (isLoaded && !shouldRender) {
    return (
      <video
        ref={externalRef || elementRef}
        src={src}
        className={className}
        data-media-id={mediaId}
        data-stable-loaded="true"
        {...props}
      />
    );
  }

  // First render or loading state
  return (
    <>
      {fallbackComponent && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-[inherit] flex items-center justify-center z-10">
          {fallbackComponent}
        </div>
      )}
      <video
        ref={externalRef || elementRef}
        src={src}
        className={className}
        data-media-id={mediaId}
        data-stable-loading="true"
        {...props}
        {...videoProps}
      />
    </>
  );
}));

StableVideo.displayName = 'StableVideo';

export default StableVideo;
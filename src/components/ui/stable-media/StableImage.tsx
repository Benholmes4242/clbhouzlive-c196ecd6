import React, { memo, forwardRef } from 'react';
import { useStableImageRenderer } from '@/hooks/useStableMediaRenderer';

interface StableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackComponent?: React.ReactNode;
}

const StableImage = memo(forwardRef<HTMLImageElement, StableImageProps>(({
  src,
  fallbackComponent,
  className = '',
  alt = '',
  ...props
}, externalRef) => {
  const { mediaId, isLoaded, elementRef, shouldRender, imageProps } = useStableImageRenderer(src);

  // If media is already loaded and stable, render the cached version
  if (isLoaded && !shouldRender) {
    return (
      <img
        ref={externalRef || elementRef}
        src={src}
        alt={alt}
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
      {fallbackComponent && !isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-[inherit] flex items-center justify-center z-10">
          {fallbackComponent}
        </div>
      )}
      <img
        ref={externalRef || elementRef}
        src={src}
        alt={alt}
        className={className}
        data-media-id={mediaId}
        data-stable-loading="true"
        {...props}
        {...imageProps}
      />
    </>
  );
}));

StableImage.displayName = 'StableImage';

export default StableImage;
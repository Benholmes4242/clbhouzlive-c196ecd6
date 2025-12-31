import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getFilterClass } from '@/utils/studioFilters';

interface PostMediaProps {
  thumbnailUrl: string;
  title?: string;
  isVideo?: boolean;
  className?: string;
  filterId?: string | null;
}

/**
 * Shared media component with skeleton loading, lazy loading, and error handling
 * Uses the global .clb-skeleton shimmer utility
 */
const PostMedia: React.FC<PostMediaProps> = ({
  thumbnailUrl,
  title,
  isVideo = false,
  className,
  filterId
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const filterClass = getFilterClass(filterId);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-muted/30", className)}>
      {/* Skeleton shimmer (shows until image loads or errors) */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 clb-skeleton" />
      )}

      {/* Thumbnail image with lazy loading */}
      {!hasError && (
        <img
          src={thumbnailUrl}
          alt={title ?? "Post thumbnail"}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover",
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            filterClass
          )}
        />
      )}

      {/* Fallback if image completely fails */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
          Failed to load
        </div>
      )}

      {/* Video overlay handled by parent tile component - no icon here */}
    </div>
  );
};

export default PostMedia;

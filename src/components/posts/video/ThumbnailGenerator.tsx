
import { useState, useEffect, useMemo } from 'react';
import { thumbnailCache, thumbnailPromises, generateVideoThumbnail } from './thumbnailCache';
import { ThumbnailState } from './types';

export const useThumbnailGenerator = (src: string, videoId: string, poster?: string): ThumbnailState => {
  // Start with poster if available, or no placeholder (will generate thumbnail immediately)
  const [thumbnailSrc, setThumbnailSrc] = useState<string>(poster || '');
  const [thumbnailReady, setThumbnailReady] = useState(!!poster); // Ready if we have a poster
  const [thumbnailError, setThumbnailError] = useState(false);

  // Memoize key values to prevent unnecessary re-runs
  const memoizedSrc = useMemo(() => src, [src]);
  const memoizedVideoId = useMemo(() => videoId, [videoId]);

  useEffect(() => {
    if (!memoizedSrc) return;

    // Check if we already have a cached thumbnail
    const cachedThumbnail = thumbnailCache.get(memoizedVideoId);
    if (cachedThumbnail) {
      setThumbnailSrc(cachedThumbnail);
      setThumbnailReady(true);
      return;
    }

    // Check if thumbnail generation is already in progress
    const existingPromise = thumbnailPromises.get(memoizedVideoId);
    if (existingPromise) {
      existingPromise.then(dataURL => {
        setThumbnailSrc(dataURL);
        setThumbnailReady(true);
      }).catch(() => {
        setThumbnailError(true);
        if (poster) {
          setThumbnailSrc(poster);
          setThumbnailReady(true);
        }
      });
      return;
    }

    // Generate thumbnail for all contexts
    const generateThumbnailPromise = generateVideoThumbnail(memoizedSrc, memoizedVideoId);
    thumbnailPromises.set(memoizedVideoId, generateThumbnailPromise);
    
    generateThumbnailPromise
      .then(dataURL => {
        setThumbnailSrc(dataURL);
        setThumbnailReady(true);
        setThumbnailError(false);
      })
      .catch(() => {
        setThumbnailError(true);
        // Use poster as fallback
        if (poster) {
          setThumbnailSrc(poster);
          setThumbnailReady(true);
        } else {
          // Show a placeholder or the video element itself
          setThumbnailReady(true);
        }
      })
      .finally(() => {
        thumbnailPromises.delete(memoizedVideoId);
      });

  }, [memoizedSrc, memoizedVideoId, poster]);

  return { thumbnailSrc, thumbnailReady, thumbnailError };
};

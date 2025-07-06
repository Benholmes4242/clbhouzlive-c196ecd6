
import { useState, useEffect } from 'react';
import { thumbnailCache, thumbnailPromises, generateVideoThumbnail } from './thumbnailCache';
import { ThumbnailState } from './types';

export const useThumbnailGenerator = (src: string, videoId: string, poster?: string): ThumbnailState => {
  const [thumbnailSrc, setThumbnailSrc] = useState<string>('');
  const [thumbnailReady, setThumbnailReady] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  useEffect(() => {
    if (!src) return;

    // Check if we already have a cached thumbnail
    const cachedThumbnail = thumbnailCache.get(videoId);
    if (cachedThumbnail) {
      setThumbnailSrc(cachedThumbnail);
      setThumbnailReady(true);
      return;
    }

    // Check if thumbnail generation is already in progress
    const existingPromise = thumbnailPromises.get(videoId);
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
    const generateThumbnailPromise = generateVideoThumbnail(src, videoId);
    thumbnailPromises.set(videoId, generateThumbnailPromise);
    
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
        thumbnailPromises.delete(videoId);
      });

  }, [src, videoId, poster]);

  return { thumbnailSrc, thumbnailReady, thumbnailError };
};


// Enhanced cache for generated thumbnails with immediate availability
export const thumbnailCache = new Map<string, string>();
export const thumbnailPromises = new Map<string, Promise<string>>();

export const generateVideoThumbnail = (src: string, videoId: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    let resolved = false;
    
    const generateThumbnail = () => {
      if (resolved) return;
      
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          
          // Cache the thumbnail for future use
          thumbnailCache.set(videoId, dataURL);
          resolved = true;
          resolve(dataURL);
        } else {
          // Video dimensions not ready, will retry
        }
      } catch (error) {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      }
    };

    // Multiple event handlers to catch thumbnail generation
    video.onloadeddata = generateThumbnail;
    video.oncanplay = generateThumbnail;
    video.onseeked = generateThumbnail;
    video.onloadedmetadata = () => {
      // Seek to get the first meaningful frame
      if (video.duration > 0) {
        video.currentTime = Math.min(0.5, video.duration * 0.1);
      }
    };
    
    video.onerror = () => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Video thumbnail generation failed'));
      }
    };
    
    video.src = src;
    video.load();

    // Timeout for thumbnail generation
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Thumbnail generation timeout'));
      }
    }, 3000);
  });
};

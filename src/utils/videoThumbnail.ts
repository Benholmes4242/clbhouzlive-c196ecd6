/**
 * Generate a thumbnail from a video file
 */
export const generateVideoThumbnail = (videoFile: File, timeOffset: number = 1): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    let settled = false;
    const objectURL = URL.createObjectURL(videoFile);

    const cleanup = () => {
      try {
        video.pause();
      } catch {
        // no-op
      }
      video.removeAttribute('src');
      try {
        video.load();
      } catch {
        // no-op
      }
      URL.revokeObjectURL(objectURL);
    };

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      cleanup();
      fn();
    };

    const captureFrame = () => {
      try {
        // Guard against 0x0 dimensions
        const w = Math.max(1, video.videoWidth || 1);
        const h = Math.max(1, video.videoHeight || 1);
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        settle(() => resolve(thumbnail));
      } catch (error) {
        settle(() => reject(error));
      }
    };

    const timeoutId = window.setTimeout(() => {
      // Safari/iOS can hang before firing seeked/canplay for some codecs.
      settle(() => reject(new Error('thumbnail_timeout')));
    }, 5000);

    video.muted = true;
    (video as any).playsInline = true;
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      // Seek to the specified time offset (fallback to near-start)
      try {
        const safeTime = Math.max(0, Math.min(timeOffset, Math.max(0, video.duration - 0.1)));
        video.currentTime = Number.isFinite(safeTime) ? safeTime : 0;
      } catch {
        // If seeking isn't allowed, just capture earliest available frame
        // (loadeddata/canplay will fire next)
      }
    };

    video.onseeked = () => {
      captureFrame();
    };

    // Fallback path if seeked doesn't fire but a frame is available
    video.onloadeddata = () => {
      if (!settled) captureFrame();
    };

    video.onerror = () => {
      settle(() => reject(new Error('Failed to load video')));
    };

    video.src = objectURL;
    video.load();
  });
};

/**
 * Convert data URL to File object
 */
export const dataURLToFile = (dataURL: string, filename: string): File => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  
  return new File([u8arr], filename, { type: mime });
};

/**
 * Get video duration in seconds
 */
export const getVideoDuration = (videoFile: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(videoFile);
  });
};

/**
 * Format duration in MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
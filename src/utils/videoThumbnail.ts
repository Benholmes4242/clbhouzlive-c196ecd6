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

    video.onloadedmetadata = () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Seek to the specified time offset (or 1 second)
      video.currentTime = Math.min(timeOffset, video.duration);
    };

    video.onseeked = () => {
      try {
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to data URL
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        
        // Clean up
        video.removeAttribute('src');
        video.load();
        
        resolve(thumbnail);
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };

    // Create object URL for the video file
    const objectURL = URL.createObjectURL(videoFile);
    video.src = objectURL;
    video.load();

    // Clean up object URL after processing
    video.onload = () => {
      URL.revokeObjectURL(objectURL);
    };
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
import { ComposerMediaItem } from "@/hooks/useSnapModal";

export async function normalizeFilesToMediaItems(files: File[]): Promise<ComposerMediaItem[]> {
  const tasks = files.map(async (file, idx) => {
    try {
      const type: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
      const previewUrl = URL.createObjectURL(file);

      // Optional: read duration with a timeout using a separate blob URL
      let duration: number | undefined = undefined;
      let thumbnailUrl: string | undefined = undefined;
      
      if (type === 'video') {
        try {
          const tmpUrl = URL.createObjectURL(file);
          duration = await readVideoDuration(tmpUrl, 1200);
        } catch {
          duration = undefined;
        }
        
        // Generate thumbnail for video (used in filter previews)
        try {
          thumbnailUrl = await generateVideoThumbnail(file);
        } catch {
          thumbnailUrl = undefined;
        }
      } else {
        // For images, use the previewUrl as thumbnail
        thumbnailUrl = previewUrl;
      }

      return {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${idx}`,
        type,
        file,
        previewUrl,
        thumbnailUrl,
        duration,
      } as ComposerMediaItem;
    } catch (e) {
      console.warn('[normalize] item failed, falling back:', file.name, e);
      const url = URL.createObjectURL(file);
      return {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${idx}`,
        type: file.type.startsWith('video') ? 'video' : 'image',
        file,
        previewUrl: url,
        thumbnailUrl: file.type.startsWith('video') ? undefined : url,
      } as ComposerMediaItem;
    }
  });

  const settled = await Promise.allSettled(tasks);
  const items = settled
    .filter((s): s is PromiseFulfilledResult<ComposerMediaItem> => s.status === 'fulfilled')
    .map((s) => s.value);

  if (!items.length) throw new Error('All media normalization failed');
  return items;
}

// Generate a thumbnail from a video file for filter previews
async function generateVideoThumbnail(videoFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    const blobUrl = URL.createObjectURL(videoFile);
    
    video.onloadeddata = () => {
      video.currentTime = 0.1; // Seek to 0.1s for thumbnail
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        // Use smaller size for thumbnail (saves memory)
        const scale = Math.min(1, 400 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(blobUrl);
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(blobUrl);
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Could not generate video thumbnail'));
          }
        }, 'image/jpeg', 0.7);
      } catch (e) {
        URL.revokeObjectURL(blobUrl);
        reject(e);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Could not load video'));
    };
    
    // Timeout after 3 seconds
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Video thumbnail generation timed out'));
    }, 3000);
    
    video.src = blobUrl;
  });
}

function readVideoDuration(src: string, timeoutMs = 1200): Promise<number | undefined> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    let done = false;

    const cleanup = () => {
      if (!done) {
        done = true;
        if (src.startsWith('blob:')) URL.revokeObjectURL(src);
      }
    };

    const to = setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, timeoutMs);

    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      clearTimeout(to);
      const d = isFinite(v.duration) ? v.duration : undefined;
      cleanup();
      resolve(d);
    };
    v.onerror = () => {
      clearTimeout(to);
      cleanup();
      resolve(undefined);
    };
    v.src = src;
  });
}

// Helper to revoke object URLs to prevent memory leaks
export function revokeMediaItemUrls(items: ComposerMediaItem[]) {
  items.forEach(item => {
    if (item.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl);
    }
    // Also revoke thumbnail URL if it's different from previewUrl
    if (item.thumbnailUrl && item.thumbnailUrl !== item.previewUrl && item.thumbnailUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.thumbnailUrl);
    }
  });
}

// Generate video thumbnail/poster frame
export async function generateVideoPoster(videoFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.currentTime = 1; // Seek to 1 second for better frame
    
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Could not generate video poster'));
        }
      }, 'image/jpeg', 0.8);
    };
    
    video.onerror = () => reject(new Error('Could not load video'));
    video.src = URL.createObjectURL(videoFile);
  });
}
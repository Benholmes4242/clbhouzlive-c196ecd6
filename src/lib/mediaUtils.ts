import { ComposerMediaItem } from "@/hooks/useSnapModal";
import { validateMediaFile } from "@/constants/postLimits";

export interface MediaValidationResult {
  validItems: ComposerMediaItem[];
  errors: Array<{ fileName: string; error: string }>;
}

/**
 * Normalize files to ComposerMediaItems with validation
 * Returns both valid items and any validation errors
 */
export async function normalizeFilesToMediaItems(files: File[]): Promise<MediaValidationResult> {
  const validItems: ComposerMediaItem[] = [];
  const errors: Array<{ fileName: string; error: string }> = [];

  const tasks = files.map(async (file, idx) => {
    try {
      const type: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
      const previewUrl = URL.createObjectURL(file);

      // For videos, extract duration for validation
      let duration: number | undefined = undefined;
      let thumbnailUrl: string | undefined = undefined;
      
      if (type === 'video') {
        try {
          const tmpUrl = URL.createObjectURL(file);
          duration = await readVideoDuration(tmpUrl, 3000); // Increased timeout for duration check
        } catch {
          duration = undefined;
        }
        
        // Generate thumbnail for video
        try {
          thumbnailUrl = await generateVideoPoster(file);
        } catch {
          thumbnailUrl = undefined;
        }
      }

      // Validate file (size, type, duration)
      const validation = validateMediaFile(file, duration);
      if (!validation.valid) {
        // Clean up blob URLs for invalid files
        URL.revokeObjectURL(previewUrl);
        return { 
          valid: false, 
          error: { fileName: file.name, error: validation.error! } 
        };
      }

      const item: ComposerMediaItem = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${idx}`,
        type,
        file,
        previewUrl,
        thumbnailUrl: type === 'video' ? thumbnailUrl : previewUrl,
        duration,
      };

      return { valid: true, item };
    } catch (e) {
      console.warn('[normalize] item failed, falling back:', file.name, e);
      
      // Still try to validate even in fallback
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        return { 
          valid: false, 
          error: { fileName: file.name, error: validation.error! } 
        };
      }
      
      const url = URL.createObjectURL(file);
      const item: ComposerMediaItem = {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${idx}`,
        type: file.type.startsWith('video') ? 'video' : 'image',
        file,
        previewUrl: url,
        thumbnailUrl: url,
      };
      return { valid: true, item };
    }
  });

  const settled = await Promise.allSettled(tasks);
  
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      if (result.value.valid && result.value.item) {
        validItems.push(result.value.item);
      } else if (!result.value.valid && result.value.error) {
        errors.push(result.value.error);
      }
    }
  }

  return { validItems, errors };
}

function readVideoDuration(src: string, timeoutMs = 3000): Promise<number | undefined> {
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
    if (item.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl);
    }
    // Also revoke thumbnail URL if different from previewUrl
    if (item.thumbnailUrl && item.thumbnailUrl !== item.previewUrl && item.thumbnailUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.thumbnailUrl);
    }
  });
}

// Generate video thumbnail/poster frame
export async function generateVideoPoster(videoFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const blobUrl = URL.createObjectURL(videoFile);
    let resolved = false;
    
    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.oncanplay = null;
      URL.revokeObjectURL(blobUrl);
    };
    
    const captureFrame = () => {
      if (resolved) return;
      resolved = true;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx || video.videoWidth === 0) {
        cleanup();
        reject(new Error('Could not get canvas context or video not ready'));
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        cleanup();
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Could not generate video poster'));
        }
      }, 'image/jpeg', 0.8);
    };
    
    // iOS requires waiting for loadedmetadata, then seeking, then onseeked
    video.onloadedmetadata = () => {
      // Seek to 0.5 seconds (or 0 if video is shorter)
      const seekTime = Math.min(0.5, video.duration || 0.5);
      video.currentTime = seekTime;
    };
    
    video.onseeked = () => {
      // Small delay for iOS to render the frame
      setTimeout(captureFrame, 50);
    };
    
    // Fallback: if seeking doesn't work, try on canplay
    video.oncanplay = () => {
      if (!resolved && video.currentTime === 0) {
        // If we couldn't seek, just capture first frame
        setTimeout(captureFrame, 100);
      }
    };
    
    video.onerror = () => {
      cleanup();
      reject(new Error('Could not load video'));
    };
    
    // Timeout fallback - capture whatever frame we have after 2s
    setTimeout(() => {
      if (!resolved) {
        captureFrame();
      }
    }, 2000);
    
    video.preload = 'metadata';
    video.playsInline = true; // Important for iOS
    video.muted = true; // Required for autoplay policies
    video.src = blobUrl;
    video.load(); // Explicitly trigger load on iOS
  });
}

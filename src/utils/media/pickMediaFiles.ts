/**
 * Media File Picker Utility
 * 
 * Uses <input type="file"> as the primary media selection method.
 * Works reliably in both web browsers and Median.co's webview.
 * 
 * All size/type limits defer to POST_LIMITS as the single source of truth.
 */

import { toast } from 'sonner';
import { POST_LIMITS } from '@/constants/postLimits';

interface PickMediaOptions {
  accept?: string;        // default: 'image/*,video/*'
  multiple?: boolean;     // default: true
  capture?: 'camera' | 'environment' | 'user'; // for camera-only mode
  maxFiles?: number;      // optional limit
}

/**
 * Extract video duration from a File using a <video> element.
 * Returns 0 if duration can't be determined (allows file through — CF will validate).
 */
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
      video.remove();
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve(0); // Can't determine in time — allow through
    }, 10000);

    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const duration = video.duration;
      cleanup();
      resolve(!isFinite(duration) || duration <= 0 ? 0 : Math.round(duration));
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      resolve(0); // Can't read — allow through
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Validate media files for size, type, and duration.
 * Uses POST_LIMITS as the single source of truth.
 */
export async function validateMediaFiles(files: File[]): Promise<File[]> {
  const validated: File[] = [];

  for (const file of files) {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // Type check
    if (!isImage && !isVideo) {
      toast.error(`${file.name} is not supported`, { description: 'Please select images or videos' });
      continue;
    }

    // Size check — use type-specific limits from POST_LIMITS
    const maxSize = isVideo
      ? POST_LIMITS.MAX_VIDEO_SIZE_BYTES
      : POST_LIMITS.MAX_IMAGE_SIZE_BYTES;
    const limitDisplay = isVideo
      ? POST_LIMITS.MAX_VIDEO_SIZE_DISPLAY
      : POST_LIMITS.MAX_IMAGE_SIZE_DISPLAY;

    if (file.size > maxSize) {
      toast.error(`${file.name} is too large`, { description: `Maximum size is ${limitDisplay}` });
      continue;
    }

    // Duration check for videos (P0-B)
    if (isVideo) {
      const duration = await getVideoDuration(file);
      if (duration > 0 && duration > POST_LIMITS.MAX_VIDEO_DURATION_SECONDS) {
        const actualMins = Math.round(duration / 60);
        toast.error(`Video is ${actualMins} minutes long`, {
          description: `Maximum is ${POST_LIMITS.MAX_VIDEO_DURATION_DISPLAY}`,
        });
        continue;
      }
    }

    validated.push(file);
  }

  return validated;
}

/**
 * Open the native file picker to select media files.
 * Returns a promise that resolves with the selected files.
 */
export function pickMediaFiles(options: PickMediaOptions = {}): Promise<File[]> {
  const { 
    accept = 'image/*,video/*', 
    multiple = true, 
    capture,
    maxFiles 
  } = options;

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple && !capture; // Can't be multiple with capture
    
    if (capture) {
      input.capture = capture;
    }
    
    input.style.display = 'none';
    document.body.appendChild(input);
    
    let handled = false;
    
    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };

    // Handle selection
    input.onchange = () => {
      if (handled) return;
      handled = true;
      
      let files = input.files ? Array.from(input.files) : [];
      
      // Apply max files limit if specified
      if (maxFiles && files.length > maxFiles) {
        files = files.slice(0, maxFiles);
        toast(`Limited to ${maxFiles} items`, { description: `Only the first ${maxFiles} items were selected` });
      }
      
      cleanup();
      resolve(files);
    };

    // Handle cancel (user dismisses picker without selecting)
    const handleFocus = () => {
      setTimeout(() => {
        if (!handled) {
          handled = true;
          cleanup();
          resolve([]);
        }
        window.removeEventListener('focus', handleFocus);
      }, 300);
    };
    window.addEventListener('focus', handleFocus);
    
    // Also handle the cancel event (modern browsers)
    input.addEventListener('cancel', () => {
      if (!handled) {
        handled = true;
        cleanup();
        resolve([]);
      }
    });

    input.click();
  });
}

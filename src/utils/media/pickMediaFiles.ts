/**
 * Media File Picker Utility
 * 
 * Uses <input type="file"> as the primary media selection method.
 * Works reliably in both web browsers and Median.co's webview.
 */

import { toast } from 'sonner';

interface PickMediaOptions {
  accept?: string;        // default: 'image/*,video/*'
  multiple?: boolean;     // default: true
  capture?: 'camera' | 'environment' | 'user'; // for camera-only mode
  maxFiles?: number;      // optional limit
}

const MAX_FILE_SIZE_MB = 50; // 50MB limit
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mov'];

/**
 * Validate media files for size and type
 */
export function validateMediaFiles(files: File[]): File[] {
  return files.filter(file => {
    // Size check
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`${file.name} is too large`, { description: `Maximum size is ${MAX_FILE_SIZE_MB}MB` });
      return false;
    }
    
    // Type check - be lenient, check if it starts with image/ or video/
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast.error(`${file.name} is not supported`, { description: 'Please select images or videos' });
      return false;
    }
    
    return true;
  });
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
    // Focus returns to window when picker closes
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

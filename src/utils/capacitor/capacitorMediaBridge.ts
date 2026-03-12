/**
 * Capacitor Media Bridge Utility
 * 
 * Bridges Capacitor's native camera/photo responses to our existing
 * ComposerMediaItem format. Handles URI-to-File conversion, HEIC-to-JPEG
 * conversion, and video metadata extraction.
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo, GalleryPhoto } from '@capacitor/camera';
import heic2any from 'heic2any';
import type { ComposerMediaItem } from '@/hooks/useSnapModal';

/**
 * Configuration for the native media picker
 */
export interface NativePickerOptions {
  maxItems?: number;
  source?: 'gallery' | 'camera';
  mediaTypes?: ('image' | 'video')[];
}

/**
 * Result from the native picker
 */
export interface NativePickerResult {
  success: boolean;
  items: ComposerMediaItem[];
  error?: string;
  permissionDenied?: boolean;
}

/**
 * Check if we're running on a native platform
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if HEIC conversion is needed based on mime type or file extension
 */
function isHeicFormat(mimeType?: string, path?: string): boolean {
  if (mimeType?.toLowerCase().includes('heic') || mimeType?.toLowerCase().includes('heif')) {
    return true;
  }
  if (path) {
    const ext = path.split('.').pop()?.toLowerCase();
    return ext === 'heic' || ext === 'heif';
  }
  return false;
}

/**
 * Convert HEIC blob to JPEG blob
 */
async function convertHeicToJpeg(blob: Blob): Promise<Blob> {
  try {
    const result = await heic2any({
      blob,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    // heic2any can return an array for multi-image HEIC files
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    console.error('[CapacitorBridge] HEIC conversion failed:', error);
    throw new Error('Failed to convert HEIC image');
  }
}

/**
 * Fetch a blob from a Capacitor webPath URI
 */
async function fetchBlobFromUri(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Failed to fetch media from URI: ${response.status}`);
  }
  return response.blob();
}

/**
 * Extract video duration from a blob URL
 */
function extractVideoDuration(blobUrl: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('error', onError);
      video.src = '';
    };
    
    const onLoaded = () => {
      const duration = video.duration;
      cleanup();
      resolve(isFinite(duration) ? duration : undefined);
    };
    
    const onError = () => {
      cleanup();
      resolve(undefined);
    };
    
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('error', onError);
    video.src = blobUrl;
    
    // Timeout fallback
    setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, 5000);
  });
}

/**
 * Generate a video thumbnail from a blob URL
 */
function generateVideoThumbnail(blobUrl: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      video.src = '';
    };
    
    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            cleanup();
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              resolve(undefined);
            }
          }, 'image/jpeg', 0.8);
        } else {
          cleanup();
          resolve(undefined);
        }
      } catch (err) {
        cleanup();
        resolve(undefined);
      }
    };
    
    const onError = () => {
      cleanup();
      resolve(undefined);
    };
    
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.addEventListener('loadedmetadata', () => {
      // Seek to 0.5 seconds or 10% of duration, whichever is smaller
      const seekTime = Math.min(0.5, video.duration * 0.1);
      video.currentTime = seekTime;
    });
    
    video.src = blobUrl;
    
    // Timeout fallback
    setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, 10000);
  });
}

/**
 * Convert a Capacitor photo/video result to a ComposerMediaItem
 */
async function photoToComposerMediaItem(
  photo: Photo | GalleryPhoto,
  index: number
): Promise<ComposerMediaItem> {
  const webPath = photo.webPath;
  
  if (!webPath) {
    throw new Error('No webPath available for media item');
  }
  
  // Fetch the blob from the URI
  let blob = await fetchBlobFromUri(webPath);
  let mimeType = blob.type || 'image/jpeg';
  
  // Determine if this is a video based on mime type
  const isVideo = mimeType.startsWith('video/');
  
  // Handle HEIC conversion for images
  if (!isVideo && isHeicFormat(mimeType, webPath)) {
    console.log('[CapacitorBridge] Converting HEIC to JPEG...');
    blob = await convertHeicToJpeg(blob);
    mimeType = 'image/jpeg';
  }
  
  // Create a File object from the blob
  const fileName = `media_${Date.now()}_${index}.${isVideo ? 'mp4' : 'jpg'}`;
  const file = new File([blob], fileName, { type: mimeType });
  
  // Create blob URL for preview
  const previewUrl = URL.createObjectURL(blob);
  
  // Build the ComposerMediaItem
  const item: ComposerMediaItem = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${index}`,
    type: isVideo ? 'video' : 'image',
    file,
    previewUrl,
    thumbnailUrl: isVideo ? undefined : previewUrl,
  };
  
  // For videos, extract duration and generate thumbnail
  if (isVideo) {
    const [duration, thumbnailUrl] = await Promise.all([
      extractVideoDuration(previewUrl),
      generateVideoThumbnail(previewUrl),
    ]);
    item.duration = duration;
    item.thumbnailUrl = thumbnailUrl;
  }
  
  return item;
}

/**
 * Open the native gallery picker
 */
export async function openNativeGalleryPicker(
  options: NativePickerOptions = {}
): Promise<NativePickerResult> {
  const { maxItems = 6 } = options;
  
  try {
    // Check permissions first
    const permissions = await Camera.checkPermissions();
    
    if (permissions.photos === 'denied') {
      return {
        success: false,
        items: [],
        error: 'Photo library access denied',
        permissionDenied: true,
      };
    }
    
    // Request permissions if not yet granted
    if (permissions.photos === 'prompt' || permissions.photos === 'prompt-with-rationale') {
      const requested = await Camera.requestPermissions({ permissions: ['photos'] });
      if (requested.photos === 'denied') {
        return {
          success: false,
          items: [],
          error: 'Photo library access denied',
          permissionDenied: true,
        };
      }
    }
    
    // Open the native picker
    const result = await Camera.pickImages({
      quality: 90,
      limit: maxItems,
    });
    
    if (!result.photos || result.photos.length === 0) {
      return {
        success: true,
        items: [],
      };
    }
    
    // Convert all photos to ComposerMediaItems
    const items = await Promise.all(
      result.photos.map((photo, index) => photoToComposerMediaItem(photo, index))
    );
    
    return {
      success: true,
      items,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // User cancelled the picker
    if (errorMessage.includes('User cancelled') || errorMessage.includes('canceled')) {
      return {
        success: true,
        items: [],
      };
    }
    
    console.error('[CapacitorBridge] Gallery picker error:', error);
    return {
      success: false,
      items: [],
      error: errorMessage || 'Failed to open gallery',
    };
  }
}

/**
 * Open the native camera
 */
export async function openNativeCamera(): Promise<NativePickerResult> {
  try {
    // Check camera permissions
    const permissions = await Camera.checkPermissions();
    
    if (permissions.camera === 'denied') {
      return {
        success: false,
        items: [],
        error: 'Camera access denied',
        permissionDenied: true,
      };
    }
    
    // Request permissions if not yet granted
    if (permissions.camera === 'prompt' || permissions.camera === 'prompt-with-rationale') {
      const requested = await Camera.requestPermissions({ permissions: ['camera'] });
      if (requested.camera === 'denied') {
        return {
          success: false,
          items: [],
          error: 'Camera access denied',
          permissionDenied: true,
        };
      }
    }
    
    // Capture photo
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });
    
    const item = await photoToComposerMediaItem(photo, 0);
    
    return {
      success: true,
      items: [item],
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // User cancelled
    if (errorMessage.includes('User cancelled') || errorMessage.includes('canceled')) {
      return {
        success: true,
        items: [],
      };
    }
    
    console.error('[CapacitorBridge] Camera error:', error);
    return {
      success: false,
      items: [],
      error: errorMessage || 'Failed to open camera',
    };
  }
}

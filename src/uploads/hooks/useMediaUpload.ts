/**
 * useMediaUpload - Unified media upload hook
 * 
 * Single hook for all media uploads that automatically routes:
 * - video/* → Cloudflare Stream (TUS protocol)
 * - image/* → Cloudflare R2
 * 
 * Features:
 * - Auto-routing based on MIME type
 * - Unified progress tracking
 * - Retry logic with exponential backoff
 * - Cancel upload support
 * - Processing status for videos
 * 
 * Usage:
 * ```tsx
 * const { upload, progress, status, error, cancel, retry } = useMediaUpload();
 * 
 * const handleFileSelect = async (file: File) => {
 *   const result = await upload(file);
 *   if (result.success) {
 *     console.log('Uploaded:', result.mediaUrl, result.streamId);
 *   }
 * };
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { getStreamPoster } from '@/utils/stream';

// ============================================
// TYPES
// ============================================

export type UploadMediaStatus =
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'processing' // Video transcoding
  | 'complete'
  | 'error'
  | 'cancelled';

export interface MediaUploadProgress {
  /** Bytes uploaded */
  loaded: number;
  /** Total bytes */
  total: number;
  /** Percentage 0-100 */
  percent: number;
  /** Upload speed in bytes per second */
  speed?: number;
  /** Estimated time remaining in seconds */
  eta?: number;
}

export interface MediaUploadResult {
  success: boolean;
  /** Final URL for the media */
  mediaUrl?: string;
  /** Cloudflare Stream UID (for videos) */
  streamId?: string;
  /** Poster/thumbnail URL */
  thumbnailUrl?: string;
  /** Video duration in seconds */
  duration?: number;
  /** Media width */
  width?: number;
  /** Media height */
  height?: number;
  /** Error details */
  error?: MediaUploadError;
}

export interface MediaUploadError {
  code: 'VALIDATION' | 'NETWORK' | 'PROCESSING' | 'TIMEOUT' | 'CANCELLED' | 'UNKNOWN';
  message: string;
  retryable: boolean;
}

export interface MediaUploadOptions {
  /** Override auto-routing: force 'stream' or 'r2' */
  destination?: 'stream' | 'r2' | 'auto';
  /** Custom metadata to attach */
  metadata?: Record<string, string>;
  /** Callback for progress updates */
  onProgress?: (progress: MediaUploadProgress) => void;
  /** Max file size override (bytes) */
  maxSize?: number;
  /** Bucket type for R2 uploads */
  bucketType?: R2BucketType;
}

export type R2BucketType = 
  | 'clbhouz-profile-images' 
  | 'clbhouz-profile-banners' 
  | 'clbhouz-post-images' 
  | 'clbhouz-course-images' 
  | 'clbhouz-review-images' 
  | 'clbhouz-club-logos' 
  | 'clbhouz-system-assets';

export interface UseMediaUploadReturn {
  /** Upload a single file */
  upload: (file: File, options?: MediaUploadOptions) => Promise<MediaUploadResult>;
  /** Upload multiple files sequentially */
  uploadMultiple: (files: File[], options?: MediaUploadOptions) => Promise<MediaUploadResult[]>;
  /** Current upload progress */
  progress: MediaUploadProgress;
  /** Current upload status */
  status: UploadMediaStatus;
  /** Current error if any */
  error: MediaUploadError | null;
  /** Cancel current upload */
  cancel: () => void;
  /** Retry failed upload */
  retry: () => Promise<MediaUploadResult>;
  /** Reset state */
  reset: () => void;
}

// ============================================
// CONSTANTS
// ============================================

// Legacy hook — main pipeline uses uploadPipeline.ts with POST_LIMITS
// Kept in sync for any direct callers of useMediaUpload
import { POST_LIMITS } from '@/constants/postLimits';
const MAX_FILE_SIZE = {
  IMAGE: POST_LIMITS.MAX_IMAGE_SIZE_BYTES,
  VIDEO: POST_LIMITS.MAX_VIDEO_SIZE_BYTES,
};

const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
];

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
];

const UPLOAD_MAX_RETRIES = 3;
const UPLOAD_RETRY_DELAY = 1000;

// ============================================
// HOOK
// ============================================

export function useMediaUpload(): UseMediaUploadReturn {
  const [status, setStatus] = useState<UploadMediaStatus>('idle');
  const [progress, setProgress] = useState<MediaUploadProgress>({
    loaded: 0,
    total: 0,
    percent: 0,
  });
  const [error, setError] = useState<MediaUploadError | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFileRef = useRef<File | null>(null);
  const lastOptionsRef = useRef<MediaUploadOptions | undefined>();
  const retryCountRef = useRef(0);
  const uploadStartTimeRef = useRef<number>(0);

  // Validate file
  const validateFile = useCallback((file: File, options?: MediaUploadOptions): MediaUploadError | null => {
    const isVideo = file.type.startsWith('video/') || SUPPORTED_VIDEO_TYPES.includes(file.type);
    const isImage = file.type.startsWith('image/') || SUPPORTED_IMAGE_TYPES.includes(file.type);
    
    const maxSize = options?.maxSize || (isVideo ? MAX_FILE_SIZE.VIDEO : MAX_FILE_SIZE.IMAGE);

    if (file.size > maxSize) {
      return {
        code: 'VALIDATION',
        message: `File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`,
        retryable: false,
      };
    }

    if (!isVideo && !isImage) {
      return {
        code: 'VALIDATION',
        message: `Unsupported file type: ${file.type}`,
        retryable: false,
      };
    }

    return null;
  }, []);

  // Determine upload destination
  const getDestination = useCallback((file: File, options?: MediaUploadOptions): 'stream' | 'r2' => {
    if (options?.destination && options.destination !== 'auto') {
      return options.destination;
    }
    return file.type.startsWith('video/') ? 'stream' : 'r2';
  }, []);

  // Update progress with speed/ETA calculation
  const updateProgress = useCallback((loaded: number, total: number, options?: MediaUploadOptions) => {
    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
    const elapsed = (Date.now() - uploadStartTimeRef.current) / 1000;
    const speed = elapsed > 0 ? loaded / elapsed : 0;
    const remaining = total - loaded;
    const eta = speed > 0 ? remaining / speed : undefined;

    const newProgress: MediaUploadProgress = { loaded, total, percent, speed, eta };
    setProgress(newProgress);
    options?.onProgress?.(newProgress);
  }, []);

  // Upload to Cloudflare Stream
  const uploadToStream = useCallback(async (
    file: File, 
    options?: MediaUploadOptions,
    signal?: AbortSignal
  ): Promise<MediaUploadResult> => {
    try {
      // Step 1: Get one-time upload URL from edge function
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('cloudflare-stream-upload', {
        body: { fileName: file.name, fileSize: file.size },
      });

      if (uploadError || !uploadData?.uploadURL || !uploadData?.uid) {
        console.error('[useMediaUpload] Failed to get upload URL:', uploadError);
        return { 
          success: false, 
          error: { 
            code: 'NETWORK', 
            message: uploadError?.message || 'Failed to get upload URL',
            retryable: true 
          } 
        };
      }

      const { uploadURL, uid } = uploadData;

      // Step 2: Reserve the stream asset in DB for cleanup tracking
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          await supabase
            .from('stream_assets')
            .insert({ uid, user_id: user.id, status: 'reserved' });
        } catch {
          // Non-fatal - continue anyway
        }
      }

      // Step 3: Upload file with progress tracking using XMLHttpRequest
      const result = await new Promise<MediaUploadResult>((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            updateProgress(e.loaded, e.total, options);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const videoUrl = generateStreamHlsUrl(uid);
            const posterUrl = getStreamPoster(uid, '1s') || undefined;
            
            resolve({
              success: true,
              mediaUrl: videoUrl,
              streamId: uid,
              thumbnailUrl: posterUrl,
            });
          } else {
            resolve({
              success: false,
              error: {
                code: 'NETWORK',
                message: `Upload failed: ${xhr.status}`,
                retryable: true,
              },
            });
          }
        });

        xhr.addEventListener('error', () => {
          resolve({
            success: false,
            error: {
              code: 'NETWORK',
              message: 'Network error during upload',
              retryable: true,
            },
          });
        });

        xhr.addEventListener('abort', () => {
          resolve({
            success: false,
            error: {
              code: 'CANCELLED',
              message: 'Upload cancelled',
              retryable: true,
            },
          });
        });

        // Handle abort signal
        if (signal) {
          signal.addEventListener('abort', () => xhr.abort());
        }

        const formData = new FormData();
        formData.append('file', file);

        xhr.open('POST', uploadURL);
        xhr.send(formData);
      });

      return result;
    } catch (err: any) {
      console.error('[useMediaUpload] Stream upload error:', err);
      return {
        success: false,
        error: {
          code: 'NETWORK',
          message: err.message || 'Upload failed',
          retryable: true,
        },
      };
    }
  }, [updateProgress]);

  // Upload to R2
  const uploadToR2 = useCallback(async (
    file: File, 
    options?: MediaUploadOptions,
    signal?: AbortSignal
  ): Promise<MediaUploadResult> => {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return {
          success: false,
          error: {
            code: 'VALIDATION',
            message: 'User not authenticated',
            retryable: false,
          },
        };
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('bucketType', options?.bucketType || 'clbhouz-post-images');

      // Upload with progress tracking
      const result = await new Promise<MediaUploadResult>((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            updateProgress(e.loaded, e.total, options);
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && response.success) {
              resolve({
                success: true,
                mediaUrl: response.publicUrl || response.url,
              });
            } else {
              resolve({
                success: false,
                error: {
                  code: 'NETWORK',
                  message: response.error || `Upload failed: ${xhr.status}`,
                  retryable: true,
                },
              });
            }
          } catch {
            resolve({
              success: false,
              error: {
                code: 'NETWORK',
                message: 'Invalid response from server',
                retryable: true,
              },
            });
          }
        });

        xhr.addEventListener('error', () => {
          resolve({
            success: false,
            error: {
              code: 'NETWORK',
              message: 'Network error during upload',
              retryable: true,
            },
          });
        });

        xhr.addEventListener('abort', () => {
          resolve({
            success: false,
            error: {
              code: 'CANCELLED',
              message: 'Upload cancelled',
              retryable: true,
            },
          });
        });

        // Handle abort signal
        if (signal) {
          signal.addEventListener('abort', () => xhr.abort());
        }

        // Get Supabase edge function URL
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const url = `${supabaseUrl}/functions/v1/cloudflare-r2-upload`;

        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.send(formData);
      });

      return result;
    } catch (err: any) {
      console.error('[useMediaUpload] R2 upload error:', err);
      return {
        success: false,
        error: {
          code: 'NETWORK',
          message: err.message || 'Upload failed',
          retryable: true,
        },
      };
    }
  }, [updateProgress]);

  // Main upload function
  const upload = useCallback(async (
    file: File,
    options?: MediaUploadOptions
  ): Promise<MediaUploadResult> => {
    // Store for retry
    lastFileRef.current = file;
    lastOptionsRef.current = options;
    retryCountRef.current = 0;
    uploadStartTimeRef.current = Date.now();

    // Reset state
    setError(null);
    setProgress({ loaded: 0, total: file.size, percent: 0 });

    // Validate
    setStatus('validating');
    const validationError = validateFile(file, options);
    if (validationError) {
      setStatus('error');
      setError(validationError);
      return { success: false, error: validationError };
    }

    // Create abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Determine destination
    const destination = getDestination(file, options);
    setStatus('uploading');

    let result: MediaUploadResult;

    if (destination === 'stream') {
      result = await uploadToStream(file, options, signal);
      
      // Show processing status for videos
      if (result.success && result.streamId) {
        setStatus('processing');
        // Note: Processing polling handled by Cloudflare Stream
        // The video will be playable within seconds typically
      }
    } else {
      result = await uploadToR2(file, options, signal);
    }

    if (result.success) {
      setStatus('complete');
      setProgress(prev => ({ ...prev, percent: 100 }));
    } else if (result.error?.code === 'CANCELLED') {
      setStatus('cancelled');
      setError(result.error);
    } else {
      setStatus('error');
      setError(result.error || {
        code: 'UNKNOWN',
        message: 'Upload failed',
        retryable: true,
      });
    }

    return result;
  }, [validateFile, getDestination, uploadToStream, uploadToR2]);

  // Upload multiple files
  const uploadMultiple = useCallback(async (
    files: File[],
    options?: MediaUploadOptions
  ): Promise<MediaUploadResult[]> => {
    const results: MediaUploadResult[] = [];
    for (const file of files) {
      const result = await upload(file, options);
      results.push(result);
      if (!result.success) break; // Stop on first error
    }
    return results;
  }, [upload]);

  // Cancel current upload
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('cancelled');
  }, []);

  // Retry failed upload
  const retry = useCallback(async (): Promise<MediaUploadResult> => {
    if (!lastFileRef.current) {
      return {
        success: false,
        error: { code: 'UNKNOWN', message: 'No file to retry', retryable: false },
      };
    }

    retryCountRef.current++;

    if (retryCountRef.current > UPLOAD_MAX_RETRIES) {
      const maxRetriesError: MediaUploadError = {
        code: 'NETWORK',
        message: 'Max retries exceeded',
        retryable: false,
      };
      setError(maxRetriesError);
      return { success: false, error: maxRetriesError };
    }

    // Exponential backoff
    const delay = UPLOAD_RETRY_DELAY * Math.pow(2, retryCountRef.current - 1);
    await new Promise(resolve => setTimeout(resolve, delay));

    return upload(lastFileRef.current, lastOptionsRef.current);
  }, [upload]);

  // Reset state
  const reset = useCallback(() => {
    setStatus('idle');
    setProgress({ loaded: 0, total: 0, percent: 0 });
    setError(null);
    lastFileRef.current = null;
    lastOptionsRef.current = undefined;
    retryCountRef.current = 0;
  }, []);

  return {
    upload,
    uploadMultiple,
    progress,
    status,
    error,
    cancel,
    retry,
    reset,
  };
}

export default useMediaUpload;

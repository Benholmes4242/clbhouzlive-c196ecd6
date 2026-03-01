/**
 * TUS Resumable Video Upload Service
 * 
 * Uses TUS protocol (https://tus.io) for chunked, resumable video uploads
 * to Cloudflare Stream. Provides:
 * - Chunked uploads (50MB chunks)
 * - Auto-resume after network interruption
 * - Exponential backoff on failures
 * - Real-time progress tracking
 */

import * as tus from 'tus-js-client';
import { supabase } from '@/integrations/supabase/client';
import { POST_LIMITS } from '@/constants/postLimits';

export interface TusUploadOptions {
  file: File;
  onProgress: (bytesUploaded: number, bytesTotal: number) => void;
  onSuccess: (streamId: string) => void;
  onError: (error: Error) => void;
  metadata?: Record<string, string>;
}

export interface TusUploadResult {
  upload: tus.Upload;
  abort: () => void;
  pause: () => void;
  resume: () => Promise<void>;
}

/**
 * Upload a video using TUS protocol for resumable uploads
 */
export async function uploadVideoWithTus(options: TusUploadOptions): Promise<TusUploadResult> {
  const { file, onProgress, onSuccess, onError, metadata = {} } = options;

  // Step 1: Get TUS endpoint from Cloudflare via edge function
  const { data: tusEndpoint, error: endpointError } = await supabase.functions.invoke(
    'cloudflare-stream-tus-endpoint',
    {
      body: {
        fileName: file.name,
        fileSizeBytes: file.size,
        maxDurationSeconds: POST_LIMITS.MAX_VIDEO_DURATION_SECONDS,
        metadata: {
          name: file.name,
          ...metadata,
        },
      },
    }
  );

  if (endpointError || !tusEndpoint?.uploadUrl) {
    const error = new Error(endpointError?.message || 'Failed to get TUS upload endpoint');
    onError(error);
    throw error;
  }

  const { uploadUrl, streamId: preassignedStreamId } = tusEndpoint;

  console.log('[TUS] Got upload URL, streamId:', preassignedStreamId);

  // Step 2: Create TUS upload instance
  const upload = new tus.Upload(file, {
    endpoint: uploadUrl,
    
    // Chunk size: 50MB (Cloudflare minimum is 5MB, max is 200MB)
    chunkSize: 50 * 1024 * 1024,
    
    // Retry configuration - exponential backoff
    retryDelays: [0, 1000, 3000, 5000, 10000, 30000],
    
    // Store upload URL for resume capability
    storeFingerprintForResuming: true,
    
    // Remove fingerprint when complete
    removeFingerprintOnSuccess: true,
    
    // Metadata for Cloudflare
    metadata: {
      filename: file.name,
      filetype: file.type,
      ...metadata,
    },
    
    // Progress callback
    onProgress: (bytesUploaded, bytesTotal) => {
      onProgress(bytesUploaded, bytesTotal);
    },
    
    // Success callback
    onSuccess: () => {
      // Extract stream ID from upload URL or use pre-assigned
      const streamId = preassignedStreamId || extractStreamIdFromUrl(upload.url);
      console.log('[TUS] Upload complete, streamId:', streamId);
      onSuccess(streamId);
    },
    
    // Error callback
    onError: (error) => {
      console.error('[TUS] Upload error:', error);
      onError(error);
    },
    
    // Called to determine if should retry
    onShouldRetry: (error, retryAttempt, _options) => {
      console.log(`[TUS] Retry attempt ${retryAttempt} after error:`, error.message);
      
      // Check if we have request info
      const req = (error as any).originalRequest;
      if (req) {
        const status = req.status;
        // Don't retry on client errors (4xx) except 408 (timeout), 429 (rate limit)
        if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
          return false;
        }
      }
      
      return true; // Retry on all other errors
    },
  });

  // Step 3: Check for previous incomplete upload
  const previousUploads = await upload.findPreviousUploads();
  if (previousUploads.length > 0) {
    console.log('[TUS] Resuming previous upload');
    upload.resumeFromPreviousUpload(previousUploads[0]);
  }

  // Step 4: Start the upload
  upload.start();

  return {
    upload,
    abort: () => upload.abort(),
    pause: () => upload.abort(), // TUS abort is effectively pause
    resume: async () => {
      const previousUploads = await upload.findPreviousUploads();
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    },
  };
}

/**
 * Extract stream ID from TUS upload URL
 */
function extractStreamIdFromUrl(url: string | null): string {
  if (!url) throw new Error('No upload URL available');
  
  // Cloudflare Stream TUS URLs format:
  // https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/{stream_id}
  const match = url.match(/\/stream\/([a-f0-9]+)/);
  if (match) return match[1];
  
  // Alternative: stream ID might be at the end of the path
  const parts = url.split('/');
  return parts[parts.length - 1];
}

/**
 * Check if there are any resumable uploads for a given file
 */
export async function hasResumableUpload(file: File): Promise<boolean> {
  try {
    // Create a temporary upload instance just to check for previous uploads
    const tempUpload = new tus.Upload(file, {
      endpoint: 'https://placeholder.com', // Not used for fingerprint check
      storeFingerprintForResuming: true,
    });
    
    const previousUploads = await tempUpload.findPreviousUploads();
    return previousUploads.length > 0;
  } catch {
    return false;
  }
}

/**
 * Clear all stored upload fingerprints (useful for debugging/reset)
 */
export function clearAllResumableUploads(): void {
  // TUS stores fingerprints in localStorage with a specific prefix
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('tus::')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`[TUS] Cleared ${keysToRemove.length} stored upload fingerprints`);
}

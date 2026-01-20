/**
 * Upload utilities with progress tracking
 */

import { supabase } from '@/integrations/supabase/client';
import type { ReviewUploadProgress } from './ReviewUploadManager';

interface R2UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Upload to Cloudflare R2 with XMLHttpRequest for progress tracking
 */
export async function uploadToCloudflareR2WithProgress(
  file: File,
  bucketType: string,
  fileName: string,
  signal: AbortSignal,
  onProgress: (progress: ReviewUploadProgress) => void
): Promise<R2UploadResult> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { success: false, error: 'Not authenticated' };
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? e.loaded / elapsed : 0;
        const remaining = e.total - e.loaded;
        const eta = speed > 0 ? remaining / speed : undefined;

        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
          speed,
          eta,
        });
      }
    });

    xhr.addEventListener('load', () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          resolve({
            success: true,
            publicUrl: response.publicUrl || response.url,
          });
        } else {
          resolve({
            success: false,
            error: response.error || `Upload failed: ${xhr.status}`,
          });
        }
      } catch {
        resolve({
          success: false,
          error: 'Invalid response from server',
        });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        error: 'Network error during upload',
      });
    });

    xhr.addEventListener('abort', () => {
      resolve({
        success: false,
        error: 'Upload cancelled',
      });
    });

    signal.addEventListener('abort', () => xhr.abort());

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);
    formData.append('bucketType', bucketType);

    const url = `https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1/cloudflare-r2-upload`;

    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.send(formData);
  });
}

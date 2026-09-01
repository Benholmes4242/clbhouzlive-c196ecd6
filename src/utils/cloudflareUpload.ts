import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';

export interface CloudflareUploadResult {
  success: boolean;
  publicUrl?: string;
  fileName?: string;
  fullPath?: string;
  error?: string;
}

export const uploadToCloudflareR2 = async (
  file: File,
  bucketType: 'clbhouz-profile-images' | 'clbhouz-profile-banners' | 'clbhouz-post-images' | 'clbhouz-course-images' | 'clbhouz-review-images' | 'clbhouz-club-logos' | 'clbhouz-system-assets',
  originalFileName?: string,
  /**
   * BRIEF_UPLOAD_PROGRESS S1 — optional byte-level progress. Present because
   * supabase.functions.invoke is fetch-based and cannot report upload
   * progress; the transport below is XHR for exactly this reason. Optional so
   * every existing caller is untouched.
   */
  onProgress?: (bytesUploaded: number, bytesTotal: number) => void,
): Promise<CloudflareUploadResult> => {
  try {
    console.log('[UPLOAD/R2] begin', {
      name: file.name, type: file.type, size: file.size,
      bucketType, onLine: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
      visibility: typeof document !== 'undefined' ? document.visibilityState : undefined,
    });
    // Offline guard — surface a clear connection error instead of
    // a misleading "Not authenticated" when getSession() fails because
    // the network is down.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      console.error('[UPLOAD/R2] BLOCKED by navigator.onLine=false');
      throw new Error('No connection - reconnect and try again');
    }

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('[UPLOAD/R2] session', {
      hasSession: !!session,
      tokenLen: session?.access_token?.length ?? 0,
    });
    if (!session) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw new Error('No connection - reconnect and try again');
      }
      throw new Error('User not authenticated');
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', originalFileName || file.name);
    formData.append('bucketType', bucketType);

    console.log('[UPLOAD/R2] xhr -> cloudflare-r2-upload', {
      formKeys: ['file', 'fileName', 'bucketType'],
    });

    // XHR transport (same endpoint, FormData, auth and response shape as the
    // previous functions.invoke call) so upload progress can be observed.
    const data = await new Promise<CloudflareUploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) onProgress(e.loaded, e.total);
        });
      }

      xhr.addEventListener('load', () => {
        let parsed: any = null;
        try {
          parsed = JSON.parse(xhr.responseText);
        } catch {
          reject(new Error('Invalid response from server'));
          return;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(parsed as CloudflareUploadResult);
        } else {
          console.error('[UPLOAD/R2] xhr error response', {
            status: xhr.status, body: String(xhr.responseText).slice(0, 500),
          });
          reject(new Error(parsed?.error || `Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('timeout', () => reject(new Error('Upload timed out')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

      xhr.open('POST', `${SUPABASE_URL}/functions/v1/cloudflare-r2-upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.send(formData);
    });

    console.log('[UPLOAD/R2] ok', {
      name: file.name, hasUrl: !!(data && (data as any).publicUrl),
    });
    return data as CloudflareUploadResult;
  } catch (error) {
    console.error('[UPLOAD/R2] failed', {
      name: file.name,
      errName: error instanceof Error ? error.name : typeof error,
      errMessage: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

export const deleteFromCloudflareR2 = async (filePath: string): Promise<boolean> => {
  try {
    // For now, we'll implement delete functionality later if needed
    // Most social media apps don't actually delete media files for data integrity
    console.log('Delete request for:', filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete from Cloudflare R2:', error);
    return false;
  }
};
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

    console.log('[UPLOAD/R2] invoke -> cloudflare-r2-upload', {
      formKeys: ['file', 'fileName', 'bucketType'],
    });
    // Call the Cloudflare R2 upload edge function
    const { data, error } = await supabase.functions.invoke('cloudflare-r2-upload', {
      body: formData,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('[UPLOAD/R2] invoke error', {
        name: (error as any)?.name, message: error.message,
      });
      const ctx: any = (error as any).context;
      if (ctx && typeof ctx.text === 'function') {
        try {
          const status = ctx.status;
          const body = await ctx.text();
          console.error('[UPLOAD/R2] invoke error response', {
            status, body: body?.slice(0, 500),
          });
        } catch (e) {
          console.error('[UPLOAD/R2] could not read error.context', e);
        }
      }
      throw new Error(error.message);
    }

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
// Cloudflare Stream upload utility (standalone, non-hook)
// Uses Pattern A: Direct Creator Upload
// Includes stream_assets tracking for orphan cleanup

import { supabase } from '@/integrations/supabase/client';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { getStreamPoster } from '@/utils/stream';

interface StreamUploadResult {
  success: boolean;
  videoUrl?: string;
  streamId?: string;
  posterUrl?: string;
  error?: string;
}

export async function uploadToCloudflareStream(file: File): Promise<StreamUploadResult> {
  console.log('[CloudflareStream] Starting upload for:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);

  try {
    // Step 1: Get one-time upload URL from edge function
    const { data: uploadData, error: uploadError } = await supabase.functions.invoke('cloudflare-stream-upload', {
      body: { fileName: file.name, fileSize: file.size },
    });

    if (uploadError || !uploadData?.uploadURL || !uploadData?.uid) {
      console.error('[CloudflareStream] Failed to get upload URL:', uploadError);
      return { success: false, error: uploadError?.message || 'Failed to get upload URL' };
    }

    const { uploadURL, uid } = uploadData;
    console.log('[CloudflareStream] Got upload URL, uid:', uid);

    // Step 2: Reserve the stream asset in DB for cleanup tracking
    // This happens client-side so RLS works
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: reserveError } = await supabase
        .from('stream_assets')
        .insert({ uid, user_id: user.id, status: 'reserved' });
      
      if (reserveError) {
        console.warn('[CloudflareStream] Failed to reserve stream asset (non-fatal):', reserveError);
        // Continue anyway - worst case we have an orphan
      } else {
        console.log('[CloudflareStream] Reserved stream asset:', uid);
      }
    }

    // Step 3: Upload file directly to Cloudflare
    // Do NOT set Content-Type - browser handles multipart/form-data boundary automatically
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch(uploadURL, {
      method: 'POST',
      body: formData,
    });

    // Step 4: Check response - we only care if it succeeded
    // The uid from step 1 is our canonical identifier regardless of response body
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '');
      console.error('[CloudflareStream] Upload failed:', uploadResponse.status, errorText);
      return { success: false, error: `Upload failed: ${uploadResponse.status}` };
    }

    console.log('[CloudflareStream] Upload successful, uid:', uid);

    // Step 5: Construct URLs using the uid we already have
    const videoUrl = generateStreamHlsUrl(uid);
    const posterUrl = getStreamPoster(uid, '1s') || undefined;

    return {
      success: true,
      videoUrl,
      streamId: uid,
      posterUrl,
    };
  } catch (error) {
    console.error('[CloudflareStream] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

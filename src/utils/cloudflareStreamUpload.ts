// Cloudflare Stream upload utility (standalone, non-hook)

import { supabase } from '@/integrations/supabase/client';

interface StreamUploadResult {
  success: boolean;
  videoUrl?: string;
  streamId?: string;
  error?: string;
}

export async function uploadToCloudflareStream(file: File): Promise<StreamUploadResult> {
  console.log('[CloudflareStream] Starting upload for:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);

  try {
    // Get upload URL from edge function
    const { data: uploadData, error: uploadError } = await supabase.functions.invoke('cloudflare-stream-upload', {
      body: { fileName: file.name, fileSize: file.size },
    });

    if (uploadError || !uploadData?.uploadURL) {
      console.error('[CloudflareStream] Failed to get upload URL:', uploadError);
      return { success: false, error: uploadError?.message || 'Failed to get upload URL' };
    }

    console.log('[CloudflareStream] Got upload URL, uploading file...');

    // Upload file to Cloudflare Stream
    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch(uploadData.uploadURL, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[CloudflareStream] Upload failed:', uploadResponse.status, errorText);
      return { success: false, error: `Upload failed: ${uploadResponse.status}` };
    }

    const result = await uploadResponse.json();
    console.log('[CloudflareStream] Upload successful:', result);

    // Extract video URL
    const streamId = result?.result?.uid || uploadData.uid;
    if (!streamId) {
      return { success: false, error: 'No stream ID returned' };
    }

    // Construct HLS URL
    const videoUrl = `https://customer-9p8qw7hk8dxqwnx6.cloudflarestream.com/${streamId}/manifest/video.m3u8`;

    return {
      success: true,
      videoUrl,
      streamId,
    };
  } catch (error) {
    console.error('[CloudflareStream] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

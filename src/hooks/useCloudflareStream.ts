import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CloudflareStreamResponse {
  success: boolean;
  result?: {
    uid: string;
    playback?: {
      hls: string;
      dash: string;
    };
    thumbnail?: string;
    preview?: string;
    status?: {
      state: string;
    };
  };
  errors?: Array<{ message: string }>;
}

export const useCloudflareStream = () => {
  const [uploading, setUploading] = useState(false);

  const uploadVideo = async (file: File): Promise<{ 
    success: boolean; 
    videoUrl?: string; 
    thumbnailUrl?: string; 
    error?: string 
  }> => {
    setUploading(true);
    
    try {
      // Get Cloudflare Stream credentials
      const { data: secrets } = await supabase.functions.invoke('get-secrets');
      
      if (!secrets?.CLOUDFLARE_STREAM_API_TOKEN || !secrets?.CLOUDFLARE_ACCOUNT_ID) {
        throw new Error('Cloudflare Stream not configured');
      }

      // Create form data for Cloudflare Stream upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('meta', JSON.stringify({
        name: `profile-video-${Date.now()}`,
        maxDurationSeconds: 20
      }));

      // Upload to Cloudflare Stream
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${secrets.CLOUDFLARE_ACCOUNT_ID}/stream`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${secrets.CLOUDFLARE_STREAM_API_TOKEN}`,
          },
          body: formData,
        }
      );

      const result: CloudflareStreamResponse = await response.json();

      if (!result.success || !result.result) {
        throw new Error(result.errors?.[0]?.message || 'Upload failed');
      }

      // Generate URLs
      const videoId = result.result.uid;
      const videoUrl = `https://customer-${secrets.CLOUDFLARE_ACCOUNT_ID.toLowerCase()}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
      const thumbnailUrl = `https://customer-${secrets.CLOUDFLARE_ACCOUNT_ID.toLowerCase()}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;

      return {
        success: true,
        videoUrl,
        thumbnailUrl
      };

    } catch (error) {
      console.error('Video upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadVideo,
    uploading
  };
};
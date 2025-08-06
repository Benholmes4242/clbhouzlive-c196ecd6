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
      // Upload to Cloudflare Stream using edge function
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('cloudflare-stream-upload', {
        body: formData,
      });

      if (error) {
        console.error('Cloudflare Stream upload error:', error);
        throw new Error(error.message || 'Upload failed');
      }

      if (!data?.success || !data?.result) {
        console.error('Cloudflare Stream upload failed:', data);
        throw new Error(data?.errors?.[0]?.message || 'Upload failed');
      }

      // Get the video URLs from Cloudflare Stream
      const videoId = data.result.uid;
      const videoUrl = data.result.playback?.hls || `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
      const thumbnailUrl = data.result.thumbnail || `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;

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
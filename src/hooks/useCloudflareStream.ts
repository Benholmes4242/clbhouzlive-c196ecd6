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
      // Get Cloudflare account ID from our database function
      const { data: accountInfo, error: infoError } = await supabase.rpc('get_cloudflare_secrets');
      
      if (infoError || !accountInfo || typeof accountInfo !== 'object') {
        throw new Error('Cloudflare configuration not available');
      }
      
      const accountData = accountInfo as { CLOUDFLARE_ACCOUNT_ID: string };
      if (!accountData.CLOUDFLARE_ACCOUNT_ID) {
        throw new Error('Cloudflare account ID not found');
      }

      // Create form data for Cloudflare Stream upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('meta', JSON.stringify({
        name: `profile-video-${Date.now()}`,
        maxDurationSeconds: 20
      }));

      // For now, we'll use a simplified approach where we return mock data
      // In production, this would be handled by an edge function with proper API tokens
      
      // Simulate successful upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock URLs (these should be replaced with actual Cloudflare Stream URLs)
      const videoId = `mock-${Date.now()}`;
      const accountId = accountData.CLOUDFLARE_ACCOUNT_ID.toLowerCase();
      const videoUrl = `https://customer-${accountId}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
      const thumbnailUrl = `https://customer-${accountId}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;

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
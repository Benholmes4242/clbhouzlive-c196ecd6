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
        maxDurationSeconds: 20,
        // Optimize for highest quality
        quality: 'high',
        bitrate: 8000, // High bitrate for 4K quality
        resolution: '1920x1080', // Minimum HD, supports up to 4K
        fps: 30
      }));

      // For now, let's upload to Supabase storage as a fallback
      // This will allow videos to play while we set up proper Cloudflare Stream integration
      
      const fileExt = file.name.split('.').pop() || 'mp4';
      const fileName = `profile-video-${Date.now()}.${fileExt}`;
      const filePath = `profile-videos/${fileName}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('post-media')
        .getPublicUrl(filePath);

      const videoUrl = urlData.publicUrl;
      
      // For thumbnail, we'll use the video URL itself (browsers can generate thumbnails)
      const thumbnailUrl = videoUrl;

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
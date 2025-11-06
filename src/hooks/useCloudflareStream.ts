import { useState } from 'react';
import { edgePost } from '@/utils/callEdge';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';

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
    videoId?: string;
    error?: string 
  }> => {
    setUploading(true);
    
    try {
      // Upload to Cloudflare Stream using edge function
      const formData = new FormData();
      formData.append('file', file);

      const data = await edgePost('cloudflare-stream-upload', formData);

      // Handle different response structures from Cloudflare Stream
      if (!data?.success) {
        console.error('Cloudflare Stream upload failed:', data);
        throw new Error(data?.errors?.[0]?.message || 'Upload failed');
      }

      // Get the video URLs from Cloudflare Stream - handle different response structures
      let videoId, videoUrl, thumbnailUrl;
      
      if (data.result?.uid) {
        // Standard Cloudflare Stream response
        videoId = data.result.uid;
        videoUrl = data.result.playback?.hls || generateStreamHlsUrl(videoId);
        thumbnailUrl = data.result.thumbnail || generateStreamThumbnailUrl(videoId);
      } else if (data.videoId) {
        // Direct response format
        videoId = data.videoId;
        videoUrl = data.playback?.hls || generateStreamHlsUrl(videoId);
        thumbnailUrl = data.thumbnail || generateStreamThumbnailUrl(videoId);
      } else {
        console.error('Invalid Cloudflare Stream response structure:', data);
        throw new Error('Invalid response from Cloudflare Stream');
      }

      return {
        success: true,
        videoUrl,
        thumbnailUrl,
        videoId
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
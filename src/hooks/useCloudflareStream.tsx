import { useState } from 'react';
import { edgePost } from '@/utils/callEdge';
import { generateStreamHlsUrl, generateStreamThumbnailUrl, CLOUDFLARE_STREAM_CONFIG } from '@/config/cloudflareStream';
import { toast } from 'sonner';

interface CloudflareStreamUploadResult {
  success: boolean;
  videoId?: string;
  thumbnail?: string;
  urls?: {
    hls: string;
    dash: string;
    thumbnail: string;
  };
  status?: string;
  error?: string;
}

interface UploadOptions {
  title?: string;
  description?: string;
  onProgress?: (progress: number) => void;
}

export const useCloudflareStream = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  

  const uploadVideo = async (file: File, options: UploadOptions = {}): Promise<CloudflareStreamUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData with video file and metadata
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.title || options.description) {
        formData.append('metadata', JSON.stringify({
          title: options.title || file.name,
          description: options.description
        }));
      }

      console.log(`Uploading video to Cloudflare Stream: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 10, 90);
          options.onProgress?.(newProgress);
          return newProgress;
        });
      }, 500);

      // Upload to Cloudflare Stream via edge function
      const data = await edgePost('cloudflare-stream-upload', formData);

      clearInterval(progressInterval);

      if (!data.success) {
        console.error('Cloudflare Stream upload failed:', data.error);
        throw new Error(data.error || 'Upload failed');
      }

      setUploadProgress(100);
      options.onProgress?.(100);

      console.log('Video uploaded successfully to Cloudflare Stream:', data.videoId);

      toast.success("Your post is out there!", { duration: 2000 });

      return {
        success: true,
        videoId: data.videoId,
        thumbnail: data.thumbnail,
        urls: data.urls,
        status: data.status
      };

    } catch (error) {
      console.error('Video upload error:', error);
      
      toast.error("Upload failed", { description: error instanceof Error ? error.message : "Failed to upload video to Cloudflare Stream" });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getVideoStatus = async (videoId: string): Promise<CloudflareStreamUploadResult> => {
    try {
      const data = await edgePost('cloudflare-stream-status', { videoId });
      return data;
    } catch (error) {
      console.error('Error getting video status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get video status'
      };
    }
  };

  // Helper to check if a file is a video
  const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/');
  };

  // Helper to get Cloudflare Stream embed URL (uses customer subdomain)
  const getEmbedUrl = (videoId: string): string => {
    return `https://${CLOUDFLARE_STREAM_CONFIG.CUSTOMER_SUBDOMAIN}/${videoId}/iframe`;
  };

  // Helper to get direct playback URL (HLS)
  const getPlaybackUrl = (videoId: string): string => {
    return generateStreamHlsUrl(videoId);
  };

  // Helper to get thumbnail URL
  const getThumbnailUrl = (videoId: string, options: { width?: number; height?: number; time?: number } = {}): string => {
    return generateStreamThumbnailUrl(videoId, options);
  };

  return {
    uploadVideo,
    getVideoStatus,
    isUploading,
    uploadProgress,
    isVideoFile,
    getEmbedUrl,
    getPlaybackUrl,
    getThumbnailUrl
  };
};
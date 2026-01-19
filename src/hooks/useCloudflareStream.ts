/**
 * @deprecated Use useMediaUpload from '@/media' instead
 * 
 * This hook is maintained for backward compatibility.
 * New code should use:
 * 
 * import { useMediaUpload } from '@/media';
 * const { upload, progress, status } = useMediaUpload();
 * const result = await upload(videoFile, { destination: 'stream' });
 */

import { useMediaUpload } from '@/media/hooks/useMediaUpload';

export const useCloudflareStream = () => {
  const { upload, progress, status, error, cancel } = useMediaUpload();

  const uploadVideo = async (file: File): Promise<{ 
    success: boolean; 
    videoUrl?: string; 
    thumbnailUrl?: string; 
    videoId?: string;
    error?: string 
  }> => {
    const result = await upload(file, { destination: 'stream' });
    
    return {
      success: result.success,
      videoUrl: result.mediaUrl,
      thumbnailUrl: result.thumbnailUrl,
      videoId: result.streamId,
      error: result.error?.message,
    };
  };

  return {
    uploadVideo,
    uploading: status === 'uploading' || status === 'processing',
  };
};
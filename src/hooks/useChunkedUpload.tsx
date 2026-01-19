/**
 * @deprecated Use useMediaUpload from '@/media' instead
 * 
 * This hook is maintained for backward compatibility.
 * New code should use:
 * 
 * import { useMediaUpload } from '@/media';
 * const { upload, progress, status } = useMediaUpload();
 */

import { useState, useCallback } from 'react';
import { useMediaUpload } from '@/media/hooks/useMediaUpload';
import type { UploadProgress, ChunkedUploadResult } from '@/types/upload';

export const useChunkedUpload = () => {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const { upload, status, reset: resetUpload } = useMediaUpload();

  const uploadFileInChunks = useCallback(async (
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ChunkedUploadResult> => {
    const totalChunks = Math.ceil(file.size / (5 * 1024 * 1024)); // 5MB chunks
    
    // Initialize progress
    const initialProgress: UploadProgress = {
      uploadedChunks: 0,
      totalChunks,
      uploadedBytes: 0,
      totalBytes: file.size,
      percentage: 0,
      isComplete: false
    };
    setProgress(initialProgress);
    onProgress?.(initialProgress);

    // Use unified upload
    const result = await upload(file, {
      bucketType: 'clbhouz-post-images',
      onProgress: (p) => {
        const newProgress: UploadProgress = {
          uploadedChunks: Math.ceil((p.percent / 100) * totalChunks),
          totalChunks,
          uploadedBytes: p.loaded,
          totalBytes: p.total,
          percentage: p.percent,
          isComplete: p.percent >= 100
        };
        setProgress(newProgress);
        onProgress?.(newProgress);
      }
    });

    if (!result.success) {
      const errorProgress: UploadProgress = {
        ...(progress || initialProgress),
        error: result.error?.message || 'Upload failed'
      };
      setProgress(errorProgress);
      onProgress?.(errorProgress);
      throw new Error(result.error?.message || 'Upload failed');
    }

    // Final progress update
    const finalProgress: UploadProgress = {
      uploadedChunks: totalChunks,
      totalChunks,
      uploadedBytes: file.size,
      totalBytes: file.size,
      percentage: 100,
      isComplete: true
    };
    setProgress(finalProgress);
    onProgress?.(finalProgress);

    return {
      filePath: result.mediaUrl || '',
      publicUrl: result.mediaUrl || '',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    };
  }, [upload, progress]);

  const resetProgress = useCallback(() => {
    setProgress(null);
    resetUpload();
  }, [resetUpload]);

  return {
    uploadFileInChunks,
    progress,
    isUploading: status === 'uploading' || status === 'processing',
    resetProgress
  };
};
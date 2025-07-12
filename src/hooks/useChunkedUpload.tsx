import { useState, useCallback } from 'react';
import { CHUNK_SIZE } from '@/utils/uploadConstants';
import { 
  initiateUploadSession, 
  uploadChunkWithRetry, 
  completeUpload 
} from '@/utils/chunkUploadHelpers';
import type { UploadProgress, ChunkedUploadResult } from '@/types/upload';

export const useChunkedUpload = () => {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFileInChunks = useCallback(async (
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ChunkedUploadResult> => {
    setIsUploading(true);
    
    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      console.log(`Starting chunked upload: ${file.name}, ${file.size} bytes, ${totalChunks} chunks`);

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

      // Step 1: Initiate upload session
      const uploadId = await initiateUploadSession(
        file.name,
        file.size,
        file.type,
        totalChunks
      );
      console.log('Upload session initiated:', uploadId);

      // Step 2: Upload chunks with retry logic
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        await uploadChunkWithRetry(uploadId, chunkIndex, chunk, onProgress, progress);

        // Update progress
        const newProgress: UploadProgress = {
          uploadedChunks: chunkIndex + 1,
          totalChunks,
          uploadedBytes: end,
          totalBytes: file.size,
          percentage: Math.round((end / file.size) * 100),
          isComplete: false
        };
        setProgress(newProgress);
        onProgress?.(newProgress);
      }

      console.log('All chunks uploaded, completing upload...');

      // Step 3: Complete the upload
      const result = await completeUpload(
        uploadId,
        file.name,
        file.size,
        file.type,
        totalChunks
      );

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

      console.log('Chunked upload completed successfully:', result.publicUrl);

      return result;

    } catch (error) {
      console.error('Chunked upload failed:', error);
      const errorProgress: UploadProgress = {
        ...(progress || {
          uploadedChunks: 0,
          totalChunks: Math.ceil(file.size / CHUNK_SIZE),
          uploadedBytes: 0,
          totalBytes: file.size,
          percentage: 0,
          isComplete: false
        }),
        error: error instanceof Error ? error.message : 'Upload failed'
      };
      setProgress(errorProgress);
      onProgress?.(errorProgress);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [progress]);

  const resetProgress = useCallback(() => {
    setProgress(null);
    setIsUploading(false);
  }, []);

  return {
    uploadFileInChunks,
    progress,
    isUploading,
    resetProgress
  };
};
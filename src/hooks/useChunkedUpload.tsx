import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UploadProgress {
  uploadedChunks: number;
  totalChunks: number;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  isComplete: boolean;
  error?: string;
}

interface ChunkedUploadResult {
  filePath: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks to avoid memory issues
const MAX_RETRIES = 3;
const COMPRESSION_THRESHOLD = 40 * 1024 * 1024; // 40MB threshold for compression

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
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('chunked-upload', {
        body: {
          action: 'initiate',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          totalChunks
        }
      });

      if (sessionError || !sessionData.success) {
        throw new Error(sessionData?.error || 'Failed to initiate upload session');
      }

      const uploadId = sessionData.uploadId;
      console.log('Upload session initiated:', uploadId);

      // Step 2: Upload chunks with retry logic
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        let retries = 0;
        let chunkUploaded = false;

        while (retries < MAX_RETRIES && !chunkUploaded) {
          try {
            // Convert chunk to base64 more efficiently
            const reader = new FileReader();
            const chunkBase64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => {
                const result = reader.result as string;
                // Remove the data URL prefix to get just the base64 string
                const base64 = result.split(',')[1];
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(chunk);
            });

            const { data: chunkData, error: chunkError } = await supabase.functions.invoke('chunked-upload', {
              body: {
                action: 'upload-chunk',
                uploadId,
                chunkIndex,
                chunkData: chunkBase64
              }
            });

            if (chunkError || !chunkData.success) {
              throw new Error(chunkData?.error || `Failed to upload chunk ${chunkIndex}`);
            }

            chunkUploaded = true;
            console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully`);

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

          } catch (error) {
            retries++;
            console.warn(`Chunk ${chunkIndex} upload attempt ${retries} failed:`, error);
            
            if (retries >= MAX_RETRIES) {
              const errorMessage = `Failed to upload chunk ${chunkIndex} after ${MAX_RETRIES} retries: ${error}`;
              console.error(errorMessage);
              throw new Error(errorMessage);
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
          }
        }
      }

      console.log('All chunks uploaded, completing upload...');

      // Step 3: Complete the upload
      const { data: completeData, error: completeError } = await supabase.functions.invoke('chunked-upload', {
        body: {
          action: 'complete',
          uploadId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          totalChunks
        }
      });

      if (completeError || !completeData.success) {
        throw new Error(completeData?.error || 'Failed to complete upload');
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

      console.log('Chunked upload completed successfully:', completeData.publicUrl);

      return {
        filePath: completeData.filePath,
        publicUrl: completeData.publicUrl,
        fileName: completeData.fileName,
        fileSize: completeData.fileSize,
        fileType: completeData.fileType
      };

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
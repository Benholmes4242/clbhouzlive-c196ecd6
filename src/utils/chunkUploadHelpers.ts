import { supabase } from '@/integrations/supabase/client';
import { CHUNK_SIZE, MAX_RETRIES } from './uploadConstants';
import type { UploadProgress } from '@/types/upload';

export const convertChunkToBase64 = async (chunk: Blob): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(chunk);
  });
};

export const initiateUploadSession = async (
  fileName: string,
  fileSize: number,
  fileType: string,
  totalChunks: number
) => {
  const { data: sessionData, error: sessionError } = await supabase.functions.invoke('chunked-upload', {
    body: {
      action: 'initiate',
      fileName,
      fileSize,
      fileType,
      totalChunks
    }
  });

  if (sessionError || !sessionData.success) {
    throw new Error(sessionData?.error || 'Failed to initiate upload session');
  }

  return sessionData.uploadId;
};

export const uploadChunkWithRetry = async (
  uploadId: string,
  chunkIndex: number,
  chunk: Blob,
  onProgress?: (progress: UploadProgress) => void,
  currentProgress?: UploadProgress
) => {
  let retries = 0;
  let chunkUploaded = false;

  while (retries < MAX_RETRIES && !chunkUploaded) {
    try {
      const chunkBase64 = await convertChunkToBase64(chunk);

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
      console.log(`Chunk ${chunkIndex + 1} uploaded successfully`);

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
};

export const completeUpload = async (
  uploadId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  totalChunks: number
) => {
  console.log('Completing upload with params:', { uploadId, fileName, fileSize, fileType, totalChunks });
  
  const { data: completeData, error: completeError } = await supabase.functions.invoke('chunked-upload', {
    body: {
      action: 'complete',
      uploadId,
      fileName,
      fileSize,
      fileType,
      totalChunks
    }
  });

  console.log('Complete upload response:', { completeData, completeError });

  if (completeError) {
    console.error('Complete upload Supabase error:', completeError);
    throw new Error(`Complete upload Supabase error: ${JSON.stringify(completeError)}`);
  }

  if (!completeData || !completeData.success) {
    console.error('Complete upload failed with response:', completeData);
    throw new Error(`Complete upload failed: ${completeData?.error || 'Unknown error'} - Full response: ${JSON.stringify(completeData)}`);
  }

  return {
    filePath: completeData.filePath,
    publicUrl: completeData.publicUrl,
    fileName: completeData.fileName,
    fileSize: completeData.fileSize,
    fileType: completeData.fileType
  };
};
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface R2UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

export const useCloudflareR2 = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadToR2 = useCallback(async (
    file: File,
    fileName: string,
    bucketName: string = 'clbhouz-media'
  ): Promise<R2UploadResult> => {
    setIsUploading(true);
    
    try {
      console.log('Starting R2 upload:', { fileName, fileSize: file.size });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('bucketName', bucketName);

      const { data, error } = await supabase.functions.invoke('cloudflare-r2-upload', {
        body: formData,
      });

      if (error) {
        console.error('R2 upload error:', error);
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        console.error('R2 upload failed:', data);
        return { success: false, error: data?.error || 'Upload failed' };
      }

      console.log('R2 upload successful:', data);
      return {
        success: true,
        url: data.publicUrl,
        fileName: data.fileName
      };

    } catch (error) {
      console.error('R2 upload exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    uploadToR2,
    isUploading
  };
};
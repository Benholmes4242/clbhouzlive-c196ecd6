import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface R2UploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export const useR2Upload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<R2UploadResult> => {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    setUploading(true);

    try {
      // Create form data for the existing R2 upload function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('bucketType', 'profile-photos'); // Organize profile photos separately

      // Call the existing cloudflare-r2-upload edge function
      const { data, error } = await supabase.functions.invoke('cloudflare-r2-upload', {
        body: formData,
      });

      if (error) {
        console.error('R2 upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload image to R2",
          variant: "destructive"
        });
        return { success: false, error: error.message };
      }

      if (data?.success && data?.url) {
        toast({
          title: "Upload successful",
          description: "Profile photo uploaded successfully!",
        });
        return { success: true, imageUrl: data.url };
      } else {
        const errorMsg = data?.error || 'Unknown upload error';
        toast({
          title: "Upload failed",
          description: errorMsg,
          variant: "destructive"
        });
        return { success: false, error: errorMsg };
      }

    } catch (error) {
      console.error('R2 upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      toast({
        title: "Upload failed",
        description: errorMsg,
        variant: "destructive"
      });
      return { success: false, error: errorMsg };
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadImage,
    uploading
  };
};
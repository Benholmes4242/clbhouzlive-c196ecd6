import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface R2UploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export const useR2Upload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<R2UploadResult> => {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate and optimize for high quality
    if (file.size > 50 * 1024 * 1024) { // Increased to 50MB for 4K images
      return { 
        success: false, 
        error: 'Image file must be less than 50MB for 4K quality uploads.' 
      };
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
        toast.error("Upload failed", { description: error.message || "Failed to upload image to R2" });
        return { success: false, error: error.message };
      }

      if (data?.success && (data?.url || data?.publicUrl)) {
        const imageUrl = data.url || data.publicUrl; // Handle both response formats
        toast.success("Photo updated");
        return { success: true, imageUrl };
      } else {
        const errorMsg = data?.error || 'Unknown upload error';
        toast.error("Upload failed", { description: errorMsg });
        return { success: false, error: errorMsg };
      }

    } catch (error) {
      console.error('R2 upload error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      toast.error("Upload failed", { description: errorMsg });
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
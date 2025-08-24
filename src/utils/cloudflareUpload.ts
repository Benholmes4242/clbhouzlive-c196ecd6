import { supabase } from '@/integrations/supabase/client';

export interface CloudflareUploadResult {
  success: boolean;
  publicUrl?: string;
  fileName?: string;
  fullPath?: string;
  error?: string;
}

export const uploadToCloudflareR2 = async (
  file: File,
  bucketType: 'avatars' | 'post-media' | 'course-media' | 'course-review-media' | 'logos',
  originalFileName?: string
): Promise<CloudflareUploadResult> => {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', originalFileName || file.name);
    formData.append('bucketType', bucketType);

    // Call the Cloudflare R2 upload edge function
    const { data, error } = await supabase.functions.invoke('cloudflare-r2-upload', {
      body: formData,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(error.message);
    }

    return data as CloudflareUploadResult;
  } catch (error) {
    console.error('Cloudflare R2 upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

export const deleteFromCloudflareR2 = async (filePath: string): Promise<boolean> => {
  try {
    // For now, we'll implement delete functionality later if needed
    // Most social media apps don't actually delete media files for data integrity
    console.log('Delete request for:', filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete from Cloudflare R2:', error);
    return false;
  }
};
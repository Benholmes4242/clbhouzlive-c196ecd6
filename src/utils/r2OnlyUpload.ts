import { supabase } from '@/integrations/supabase/client';

export interface R2OnlyUploadResult {
  success: boolean;
  publicUrl?: string;
  fileName?: string;
  fullPath?: string;
  error?: string;
}

/**
 * Upload files ONLY to Cloudflare R2 - no Supabase storage allowed
 * This is the single source of truth for all image uploads
 */
export const uploadToR2Only = async (
  file: File,
  bucketType: 'avatars' | 'post-media' | 'course-media' | 'course-review-media' | 'logos' | 'profile-media' | 'profile-backgrounds' | 'profile-images',
  originalFileName?: string
): Promise<R2OnlyUploadResult> => {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (max 50MB for high quality)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('Image file must be less than 50MB');
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', originalFileName || file.name);
    formData.append('bucketType', bucketType);

    console.log(`Uploading to R2 only - Bucket: ${bucketType}, File: ${originalFileName || file.name}`);

    // Call the Cloudflare R2 upload edge function
    const { data, error } = await supabase.functions.invoke('cloudflare-r2-upload', {
      body: formData,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('R2 upload error:', error);
      throw new Error(error.message);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Upload failed');
    }

    console.log('R2 upload successful:', data);
    return {
      success: true,
      publicUrl: data.publicUrl || data.url,
      fileName: data.fileName,
      fullPath: data.fullPath
    };

  } catch (error) {
    console.error('R2-only upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Safeguard function to prevent accidental Supabase storage uploads
 * Call this before any upload operation to ensure R2-only policy
 */
export const enforceR2OnlyPolicy = () => {
  const warning = 'WARNING: All images must be uploaded to Cloudflare R2 only. Supabase storage is not allowed for images.';
  console.warn(warning);
  
  // Override Supabase storage methods to prevent accidental usage
  if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    const storageErrorMessage = 'BLOCKED: Supabase storage upload attempted. Use uploadToR2Only() instead.';
    
    // Monitor for any Supabase storage calls
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0] as string;
      if (typeof url === 'string' && url.includes('/storage/v1/object/')) {
        originalConsoleError(storageErrorMessage);
        throw new Error(storageErrorMessage);
      }
      return originalFetch.apply(this, args);
    };
  }
};

/**
 * Delete file from R2 (placeholder for future implementation)
 */
export const deleteFromR2Only = async (filePath: string): Promise<boolean> => {
  try {
    console.log('Delete request for R2 file:', filePath);
    // TODO: Implement R2 delete functionality when needed
    return true;
  } catch (error) {
    console.error('Failed to delete from R2:', error);
    return false;
  }
};

import { supabase } from '@/integrations/supabase/client';
import { uploadToCloudflareR2 } from '@/utils/cloudflareUpload';

export const uploadMultipleMediaWithRetry = async (
  files: File[], 
  postId: string, 
  userId: string, 
  maxRetries = 3
): Promise<void> => {
  console.log(`Starting batch upload for ${files.length} files`);
  
  if (!files.length || !postId || !userId) {
    throw new Error('Missing required parameters for media upload');
  }

  // Upload files in parallel with a limit to avoid overwhelming the server
  const concurrentUploads = 3;
  const chunks = [];
  
  for (let i = 0; i < files.length; i += concurrentUploads) {
    chunks.push(files.slice(i, i + concurrentUploads));
  }

  for (const chunk of chunks) {
    const uploadPromises = chunk.map(file => uploadMediaWithRetry(file, postId, userId, maxRetries));
    await Promise.all(uploadPromises);
  }
  
  console.log(`Successfully uploaded all ${files.length} files`);
};

export const uploadMediaWithRetry = async (
  file: File, 
  postId: string, 
  userId: string, 
  maxRetries = 3
): Promise<string> => {
  console.log(`Starting upload for ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  
  if (!file || !postId || !userId) {
    throw new Error('Missing required parameters for media upload');
  }

  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries} for ${file.name}`);
      
      // Upload to Cloudflare R2 instead of Supabase storage
      const fileExt = file.name.split('.').pop() || 'unknown';
      const fileName = `${postId}-${Date.now()}-${attempt}.${fileExt}`;
      
      const uploadResult = await uploadToCloudflareR2(file, 'post-media', fileName);
      
      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const publicUrl = uploadResult.publicUrl;
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      
      const { error: mediaError } = await supabase
        .from('post_media')
        .insert({
          post_id: postId,
          media_type: mediaType,
          media_url: publicUrl
        });

      if (mediaError) {
        console.error('Error inserting media record:', mediaError);
        throw mediaError;
      }
      
      console.log(`Successfully uploaded ${file.name} on attempt ${attempt}`);
      return publicUrl; // Return the URL for success case
      
    } catch (error) {
      console.error(`Upload attempt ${attempt} failed for ${file.name}:`, error);
      lastError = error;
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // All retries failed
  console.error(`All ${maxRetries} upload attempts failed for ${file.name}`);
  throw lastError || new Error('Upload failed after all retries');
};

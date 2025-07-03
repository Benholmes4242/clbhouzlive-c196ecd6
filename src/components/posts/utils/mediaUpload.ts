
import { supabase } from '@/integrations/supabase/client';

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
      const fileExt = file.name.split('.').pop() || 'unknown';
      const fileName = `${userId}/${postId}/${Date.now()}-${attempt}.${fileExt}`;
      
      // Set longer timeout for larger files, especially videos
      const isVideo = file.type.startsWith('video/');
      const baseTimeout = isVideo ? 300000 : 120000; // 5 minutes for videos, 2 for images
      const timeoutMs = Math.max(baseTimeout, file.size / 1024 / 1024 * 15000); // 15s per MB
      
      console.log(`Upload attempt ${attempt}/${maxRetries} for ${file.name}, timeout: ${timeoutMs}ms`);
      
      const uploadPromise = supabase.storage
        .from('post-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), timeoutMs)
      );

      const { data, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

      if (uploadError) {
        console.error(`Upload error on attempt ${attempt}:`, uploadError);
        throw uploadError;
      }

      if (!data) {
        throw new Error('No upload data returned');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

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

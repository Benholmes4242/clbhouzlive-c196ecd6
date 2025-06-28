
import { supabase } from '@/integrations/supabase/client';

export const uploadMediaWithRetry = async (
  file: File, 
  postId: string, 
  userId: string, 
  maxRetries = 3
): Promise<void> => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}-${attempt}.${fileExt}`;
      
      // Set longer timeout for larger files, especially videos
      const isVideo = file.type.startsWith('video/');
      const baseTimeout = isVideo ? 300000 : 120000; // 5 minutes for videos, 2 for images
      const timeoutMs = Math.max(baseTimeout, file.size / 1024 / 1024 * 15000); // 15s per MB
      
      console.log(`Uploading ${file.name} (attempt ${attempt}/${maxRetries}), timeout: ${timeoutMs}ms`);
      
      const uploadPromise = supabase.storage
        .from('post-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), timeoutMs)
      );

      const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      
      const { error: mediaError } = await supabase
        .from('post_media')
        .insert({
          post_id: postId,
          media_type: mediaType,
          media_url: publicUrl
        });

      if (mediaError) throw mediaError;
      
      console.log(`Successfully uploaded ${file.name} on attempt ${attempt}`);
      return; // Success, exit retry loop
      
    } catch (error) {
      console.error(`Upload attempt ${attempt} failed for ${file.name}:`, error);
      lastError = error;
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  // All retries failed
  throw lastError;
};

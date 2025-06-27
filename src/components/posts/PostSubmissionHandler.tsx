
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}

interface PostSubmissionHandlerProps {
  user: any;
  content: string;
  mediaFiles: File[];
  selectedTags: TaggableEntity[];
  onSuccess: () => void;
  onError: () => void;
}

export const usePostSubmission = () => {
  const { toast } = useToast();

  const getFileErrorMessage = (file: File, error: any) => {
    const maxSize = 150 * 1024 * 1024; // 150MB
    
    if (file.size > maxSize) {
      return `File too large: ${file.name} exceeds 150MB limit`;
    }
    
    if (error?.message?.includes('timeout')) {
      return 'Upload timed out. Please check your connection and try again';
    }
    
    if (error?.message?.includes('format') || error?.message?.includes('type')) {
      return `Video format not supported: ${file.name}. Please use MP4, MOV, or AVI format`;
    }
    
    return `Upload failed for ${file.name}. Please try again`;
  };

  const uploadMediaWithRetry = async (file: File, postId: string, userId: string, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${attempt}.${fileExt}`;
        
        // Set longer timeout for larger files
        const timeoutMs = Math.max(120000, file.size / 1024 / 1024 * 10000); // At least 2 minutes, plus 10s per MB
        
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

  const createPostTags = async (postId: string, selectedTags: TaggableEntity[], userId: string) => {
    if (selectedTags.length === 0) return;

    const tagInserts = selectedTags.map(tag => ({
      post_id: postId,
      tagged_entity_id: tag.id,
      tagged_by_user_id: userId
    }));

    const { error } = await supabase
      .from('post_tags')
      .insert(tagInserts);

    if (error) throw error;
  };

  const rollbackPost = async (postId: string) => {
    try {
      console.log('Rolling back post creation for:', postId);
      
      // Delete post media
      await supabase
        .from('post_media')
        .delete()
        .eq('post_id', postId);

      // Delete post tags
      await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', postId);

      // Delete the post
      await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      console.log('Post rollback completed for:', postId);
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
  };

  const createOptimisticPost = (user: any, content: string, mediaFiles: File[], selectedTags: TaggableEntity[]) => {
    const optimisticPost = {
      id: `temp-${Date.now()}`,
      content: content.trim() || null,
      created_at: new Date().toISOString(),
      user: {
        id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
        username: user.user_metadata?.username || null,
        profile_photo_url: user.user_metadata?.profile_photo_url || null
      },
      post_media: mediaFiles.map((file, index) => ({
        id: `temp-media-${index}`,
        media_type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
        media_url: URL.createObjectURL(file),
        uploading: true
      })),
      post_tags: selectedTags,
      uploading: true
    };

    return optimisticPost;
  };

  const validateFiles = (mediaFiles: File[]) => {
    const maxSize = 150 * 1024 * 1024; // 150MB
    const supportedVideoTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'video/avi', 'video/x-msvideo'];
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    for (const file of mediaFiles) {
      if (file.size > maxSize) {
        return `File "${file.name}" is too large. Maximum size is 150MB.`;
      }
      
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      
      if (isVideo && !supportedVideoTypes.includes(file.type)) {
        return `Video format "${file.type}" is not supported. Please use MP4, MOV, or AVI format.`;
      }
      
      if (isImage && !supportedImageTypes.includes(file.type)) {
        return `Image format "${file.type}" is not supported. Please use JPEG, PNG, GIF, or WebP format.`;
      }
      
      if (!isVideo && !isImage) {
        return `File "${file.name}" is not a supported media type.`;
      }
    }
    
    return null; // No validation errors
  };

  const submitPost = async ({
    user,
    content,
    mediaFiles,
    selectedTags,
    onSuccess,
    onError
  }: PostSubmissionHandlerProps) => {
    if (!user || (!content.trim() && mediaFiles.length === 0)) return;

    // Validate files before proceeding
    const validationError = validateFiles(mediaFiles);
    if (validationError) {
      toast({
        title: "Upload Error",
        description: validationError,
        variant: "destructive",
        duration: 5000
      });
      onError();
      return;
    }

    // Show centered "Post shared!" toast message
    toast({
      title: "Post shared! It's out there! 🎉",
      description: "",
      duration: 2000,
      className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black text-white border-none text-center font-semibold"
    });

    // Create optimistic post for immediate UI update
    const optimisticPost = createOptimisticPost(user, content, mediaFiles, selectedTags);
    
    // Immediately call onSuccess to update UI
    onSuccess();

    // Start background upload process
    let createdPostId: string | null = null;
    
    try {
      console.log('Starting background post creation...');
      
      // Create the post first
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim() || null
        })
        .select()
        .single();

      if (postError) {
        console.error('Post creation error:', postError);
        throw new Error('Failed to create post');
      }

      console.log('Post created successfully:', postData.id);
      createdPostId = postData.id;

      // Upload media files if any
      if (mediaFiles.length > 0) {
        console.log('Uploading media files in background...');
        
        // Upload each file with retry logic
        for (const file of mediaFiles) {
          try {
            await uploadMediaWithRetry(file, postData.id, user.id);
          } catch (error) {
            console.error(`Failed to upload ${file.name} after retries:`, error);
            
            // Show specific error for this file
            toast({
              title: "Upload Error",
              description: getFileErrorMessage(file, error),
              variant: "destructive",
              duration: 8000,
              action: (
                <button
                  onClick={() => {
                    // Retry just this file
                    uploadMediaWithRetry(file, postData.id, user.id).catch(console.error);
                  }}
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium"
                >
                  Retry
                </button>
              )
            });
            
            // Continue with other files instead of failing completely
            continue;
          }
        }
        
        console.log('Background media upload completed');
      }

      // Create post tags if any
      if (selectedTags.length > 0) {
        console.log('Creating post tags...');
        await createPostTags(postData.id, selectedTags, user.id);
        console.log('Post tags created');
      }

      console.log('Background upload process completed successfully');

      // Show success message for videos (only if there were videos)
      const hasVideos = mediaFiles.some(file => file.type.startsWith('video/'));
      if (hasVideos) {
        toast({
          title: "Video processed!",
          description: "Your video post is now live.",
          duration: 3000
        });
      }

      // Broadcast success event for feed refresh
      window.dispatchEvent(new CustomEvent('postUploadCompleted', { 
        detail: { postId: postData.id, optimisticId: optimisticPost.id } 
      }));

    } catch (error) {
      console.error('Error in background upload:', error);
      
      // If we created a post but subsequent operations failed, roll it back
      if (createdPostId) {
        await rollbackPost(createdPostId);
      }
      
      // Show retry option with specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Upload failed",
        description: `${errorMessage}. Tap to retry uploading your post.`,
        variant: "destructive",
        duration: 8000,
        action: (
          <button
            onClick={() => {
              // Retry the upload
              submitPost({ user, content, mediaFiles, selectedTags, onSuccess: () => {}, onError });
            }}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium"
          >
            Retry
          </button>
        )
      });

      // Broadcast error event for UI cleanup
      window.dispatchEvent(new CustomEvent('postUploadFailed', { 
        detail: { optimisticId: optimisticPost.id } 
      }));
    }
  };

  return { submitPost };
};

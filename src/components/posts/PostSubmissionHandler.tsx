
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateFiles, getFileErrorMessage } from './utils/fileValidation';
import { uploadMediaWithRetry } from './utils/mediaUpload';
import { createPostTags, rollbackPost, createTagNotifications } from './utils/postOperations';
import { createOptimisticPost } from './utils/optimisticPost';

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
    const validationResult = validateFiles(mediaFiles);
    if (!validationResult.isValid) {
      toast({
        title: "Upload Error",
        description: validationResult.error,
        variant: "destructive",
        duration: 5000
      });
      onError();
      return;
    }

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

        // Create notifications for tagged users
        console.log('Creating tag notifications...');
        await createTagNotifications(postData.id, selectedTags, user.id);
        console.log('Tag notifications created');
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

  const deletePost = async (postId: string) => {
    try {
      // Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Broadcast delete event for UI cleanup
      window.dispatchEvent(new CustomEvent('postDeleted', { 
        detail: { postId } 
      }));

    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  return { submitPost, deletePost };
};


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

  const uploadMedia = async (file: File, postId: string, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('post-media')
      .upload(fileName, file);

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

  const submitPost = async ({
    user,
    content,
    mediaFiles,
    selectedTags,
    onSuccess,
    onError
  }: PostSubmissionHandlerProps) => {
    if (!user || (!content.trim() && mediaFiles.length === 0)) return;

    // Show instant feedback
    toast({
      title: "Post shared!",
      description: mediaFiles.length > 0 ? "Uploading media in background..." : "Your post has been shared successfully.",
      duration: 1000
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
        for (const file of mediaFiles) {
          await uploadMedia(file, postData.id, user.id);
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
      
      // Show retry option
      toast({
        title: "Upload failed",
        description: "Tap to retry uploading your post.",
        variant: "destructive",
        duration: 5000,
        action: {
          altText: "Retry",
          onClick: () => {
            // Retry the upload
            submitPost({ user, content, mediaFiles, selectedTags, onSuccess: () => {}, onError });
          }
        }
      });

      // Broadcast error event for UI cleanup
      window.dispatchEvent(new CustomEvent('postUploadFailed', { 
        detail: { optimisticId: optimisticPost.id } 
      }));
    }
  };

  return { submitPost };
};

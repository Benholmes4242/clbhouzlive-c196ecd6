
import { supabase } from '@/integrations/supabase/client';
import { uploadMediaWithRetry, uploadMultipleMediaWithRetry } from '@/components/posts/utils/mediaUpload';
import { createPostTags, rollbackPost, createTagNotifications } from '@/components/posts/utils/postOperations';
import { TaggableEntity } from './types';

export const createPost = async (userId: string, content: string, actorType: 'personal' | 'business' = 'personal', actorId?: string) => {
  console.log('Creating post in database...', { userId, contentLength: content?.length || 0, actorType, actorId });
  
  if (!userId) {
    throw new Error('User ID is required to create a post');
  }

  const { data: postData, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content: content?.trim() || null,
      actor_type: actorType,
      actor_id: actorId || userId,
    })
    .select()
    .single();

  if (postError) {
    console.error('Post creation error:', postError);
    throw new Error(`Failed to create post: ${postError.message}`);
  }

  if (!postData) {
    throw new Error('No post data returned from database');
  }

  console.log('Post created successfully:', postData);
  return postData;
};

export const uploadMediaFiles = async (
  mediaFiles: File[], 
  postId: string, 
  userId: string,
  onFileError: (file: File, error: any) => void
) => {
  if (!mediaFiles || mediaFiles.length === 0) return;

  console.log('Starting media upload for', mediaFiles.length, 'files');
  
  const uploadPromises = mediaFiles.map(async (file, index) => {
    try {
      console.log(`Uploading file ${index + 1}/${mediaFiles.length}:`, file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);
      await uploadMediaWithRetry(file, postId, userId);
      console.log(`Successfully uploaded file ${index + 1}/${mediaFiles.length}:`, file.name);
    } catch (error) {
      console.error(`Failed to upload ${file.name} after retries:`, error);
      onFileError(file, error);
      
      // For videos, continue with other files instead of failing completely
      const isVideo = file.type.startsWith('video/');
      if (!isVideo) {
        throw new Error(`Failed to upload ${file.name}: ${error}`);
      }
    }
  });

  // Wait for all uploads to complete
  await Promise.all(uploadPromises);
  console.log('All media files processed successfully');
};

export const handlePostTags = async (
  postId: string, 
  selectedTags: TaggableEntity[], 
  userId: string,
  caption: string = ''
) => {
  if (!selectedTags || selectedTags.length === 0) return;

  console.log('Creating post tags...', { postId, tagCount: selectedTags.length });
  
  try {
    await createPostTags(postId, selectedTags, userId, caption);
    console.log('Post tags created successfully');

    console.log('Creating tag notifications...');
    await createTagNotifications(postId, selectedTags, userId);
    console.log('Tag notifications created successfully');
  } catch (error) {
    console.error('Error handling post tags:', error);
    // Don't throw the error here - tags are not critical to post success
    // The post should still be considered successful even if tagging fails
    console.log('Post created successfully despite tag creation failure');
  }
};

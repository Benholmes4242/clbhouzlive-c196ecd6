
import { supabase } from '@/integrations/supabase/client';
import { uploadMediaWithRetry } from '@/components/posts/utils/mediaUpload';
import { getFileErrorMessage } from '@/components/posts/utils/fileValidation';
import { createPostTags, rollbackPost, createTagNotifications } from '@/components/posts/utils/postOperations';
import { TaggableEntity } from './types';

export const createPost = async (userId: string, content: string) => {
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content: content.trim() || null
    })
    .select()
    .single();

  if (postError) {
    console.error('Post creation error:', postError);
    throw new Error('Failed to create post');
  }

  console.log('Post created successfully:', postData.id);
  return postData;
};

export const uploadMediaFiles = async (
  mediaFiles: File[], 
  postId: string, 
  userId: string,
  onFileError: (file: File, error: any) => void
) => {
  if (mediaFiles.length === 0) return;

  console.log('Uploading media files...');
  
  for (const file of mediaFiles) {
    try {
      await uploadMediaWithRetry(file, postId, userId);
    } catch (error) {
      console.error(`Failed to upload ${file.name} after retries:`, error);
      onFileError(file, error);
      
      // For videos, continue with other files instead of failing completely
      const isVideo = file.type.startsWith('video/');
      if (!isVideo) {
        throw error;
      }
    }
  }
  
  console.log('Media upload completed');
};

export const handlePostTags = async (
  postId: string, 
  selectedTags: TaggableEntity[], 
  userId: string
) => {
  if (selectedTags.length === 0) return;

  console.log('Creating post tags...');
  await createPostTags(postId, selectedTags, userId);
  console.log('Post tags created');

  console.log('Creating tag notifications...');
  await createTagNotifications(postId, selectedTags, userId);
  console.log('Tag notifications created');
};

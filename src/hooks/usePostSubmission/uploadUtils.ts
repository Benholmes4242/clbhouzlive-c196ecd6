import { createPostTags, createTagNotifications } from '@/components/posts/utils/postOperations';
import { TaggableEntity } from './types';

// Re-export the canonical createPost from services
// This ensures all imports use the same, complete implementation
export { createPost } from '@/services/posts/createPost';

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

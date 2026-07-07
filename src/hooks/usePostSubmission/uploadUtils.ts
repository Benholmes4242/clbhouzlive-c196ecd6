// Re-export the canonical createPost from services
// This ensures all imports use the same, complete implementation
export { createPost } from '@/services/posts/createPost';

// Mention/tag system was removed. handlePostTags is now a no-op kept for
// backwards-compatible call sites; the upload pipeline can drop the call
// once every caller stops passing selectedTags.
export const handlePostTags = async (
  _postId: string,
  _selectedTags: unknown[],
  _userId: string,
  _caption: string = ''
): Promise<void> => {
  return;
};

import { useState, useCallback, useMemo } from 'react';
import { ExploreContentItem } from '@/components/explore/types';

interface OptimisticPost extends ExploreContentItem {
  isOptimistic: boolean;
}

interface UseOptimisticPostInsertProps {
  existingContent: ExploreContentItem[];
  onContentUpdate: (content: ExploreContentItem[]) => void;
}

export const useOptimisticPostInsert = ({ 
  existingContent, 
  onContentUpdate 
}: UseOptimisticPostInsertProps) => {
  const [optimisticPosts, setOptimisticPosts] = useState<OptimisticPost[]>([]);
  const [newPostSpotlight, setNewPostSpotlight] = useState<string | null>(null);

  // Insert a new post optimistically at the top of the feed
  const insertOptimisticPost = useCallback((postData: {
    id: string;
    user: any;
    content: string;
    mediaFiles: File[];
    coverIndex?: number;
  }) => {
    const optimisticPost: OptimisticPost = {
      id: postData.id,
      isOptimistic: true,
      user: {
        id: postData.user.id,
        name: postData.user.name || postData.user.email?.split('@')[0] || 'Unknown User',
        username: postData.user.username || postData.user.email?.split('@')[0] || 'unknown',
        avatar: postData.user.avatar_url || ''
      },
      media: postData.mediaFiles.map((file, index) => ({
        id: `${postData.id}-media-${index}`,
        media_type: file.type.startsWith('video') ? 'video' : 'image',
        media_url: URL.createObjectURL(file)
      })),
      src: URL.createObjectURL(postData.mediaFiles[postData.coverIndex || 0]),
      type: postData.mediaFiles[postData.coverIndex || 0]?.type.startsWith('video') ? 'video' : 'image',
      title: postData.content || 'New post',
      ctaDescription: postData.content || '',
      // Add required ExploreContentItem properties
      likes: 0,
      isFollowing: false
    };

    setOptimisticPosts(prev => [optimisticPost, ...prev]);
    
    // Add spotlight effect
    setNewPostSpotlight(postData.id);
    setTimeout(() => setNewPostSpotlight(null), 1200);

    return optimisticPost;
  }, []);

  // Remove optimistic post and replace with real data
  const confirmOptimisticPost = useCallback((optimisticId: string, realPost: ExploreContentItem) => {
    setOptimisticPosts(prev => prev.filter(post => post.id !== optimisticId));
    
    // Insert real post at the top if it's not already there
    const isAlreadyInFeed = existingContent.some(item => item.id === realPost.id);
    if (!isAlreadyInFeed) {
      onContentUpdate([realPost, ...existingContent]);
    }
  }, [existingContent, onContentUpdate]);

  // Remove failed optimistic post
  const removeOptimisticPost = useCallback((optimisticId: string) => {
    setOptimisticPosts(prev => prev.filter(post => post.id !== optimisticId));
  }, []);

  // Merged content with optimistic posts at the top
  const mergedContent = useMemo(() => {
    return [...optimisticPosts, ...existingContent];
  }, [optimisticPosts, existingContent]);

  // Check if a post should show spotlight effect
  const shouldShowSpotlight = useCallback((postId: string) => {
    return newPostSpotlight === postId;
  }, [newPostSpotlight]);

  return {
    mergedContent,
    insertOptimisticPost,
    confirmOptimisticPost,
    removeOptimisticPost,
    shouldShowSpotlight,
    hasOptimisticPosts: optimisticPosts.length > 0
  };
};
import { useState, useCallback } from 'react';
import type { ExploreContentItem } from '@/components/explore/types';

export interface OptimisticPost extends ExploreContentItem {
  isOptimistic?: boolean;
  spotlight?: boolean;
}

export const useOptimisticPostInsertion = () => {
  const [optimisticPosts, setOptimisticPosts] = useState<OptimisticPost[]>([]);

  const addOptimisticPost = useCallback((postData: {
    caption: string;
    files: File[];
    selectedCourse?: any;
    visibility: 'public' | 'private';
    coverIndex?: number;
    userId: string;
    userProfile?: any;
  }) => {
    const optimisticId = `optimistic-${Date.now()}`;
    const coverFile = postData.files[postData.coverIndex || 0];
    const coverUrl = URL.createObjectURL(coverFile);
    
    const optimisticPost: OptimisticPost = {
      id: optimisticId,
      title: postData.caption,
      type: coverFile.type.startsWith('video') ? 'video' : 'image',
      src: coverUrl,
      user: postData.userProfile ? {
        id: postData.userProfile.id,
        name: postData.userProfile.display_name || postData.userProfile.username || 'User',
        username: postData.userProfile.username,
        avatar: postData.userProfile.profile_photo_url ?? null,
        verified: false
      } : undefined,
      likes: 0,
      comments: 0,
      media: postData.files.map((file, index) => ({
        id: `${optimisticId}-media-${index}`,
        media_type: file.type.startsWith('video') ? 'video' : 'image',
        media_url: URL.createObjectURL(file)
      })),
      isOptimistic: true,
      spotlight: true
    };

    setOptimisticPosts(prev => [optimisticPost, ...prev]);

    // Remove spotlight after animation duration
    setTimeout(() => {
      setOptimisticPosts(prev => 
        prev.map(post => 
          post.id === optimisticId 
            ? { ...post, spotlight: false }
            : post
        )
      );
    }, 1200);

    return optimisticId;
  }, []);

  const updateOptimisticPost = useCallback((optimisticId: string, serverPost: ExploreContentItem) => {
    setOptimisticPosts(prev => 
      prev.map(post => 
        post.id === optimisticId 
          ? { ...serverPost, isOptimistic: false, spotlight: false }
          : post
      )
    );
  }, []);

  const removeOptimisticPost = useCallback((optimisticId: string) => {
    setOptimisticPosts(prev => prev.filter(post => post.id !== optimisticId));
  }, []);

  const clearOptimisticPosts = useCallback(() => {
    setOptimisticPosts([]);
  }, []);

  return {
    optimisticPosts,
    addOptimisticPost,
    updateOptimisticPost,
    removeOptimisticPost,
    clearOptimisticPosts
  };
};
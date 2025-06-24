
import { useState, useEffect } from 'react';

interface OptimisticPost {
  id: string;
  content: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: {
    id: string;
    media_type: 'image' | 'video';
    media_url: string;
    uploading?: boolean;
  }[];
  post_tags: any[];
  uploading?: boolean;
}

export const useOptimisticPosts = () => {
  const [optimisticPosts, setOptimisticPosts] = useState<OptimisticPost[]>([]);

  useEffect(() => {
    const handlePostCompleted = (event: CustomEvent) => {
      const { optimisticId } = event.detail;
      setOptimisticPosts(prev => prev.filter(post => post.id !== optimisticId));
    };

    const handlePostFailed = (event: CustomEvent) => {
      const { optimisticId } = event.detail;
      setOptimisticPosts(prev => 
        prev.map(post => 
          post.id === optimisticId 
            ? { ...post, uploadFailed: true }
            : post
        )
      );
    };

    window.addEventListener('postUploadCompleted', handlePostCompleted as EventListener);
    window.addEventListener('postUploadFailed', handlePostFailed as EventListener);

    return () => {
      window.removeEventListener('postUploadCompleted', handlePostCompleted as EventListener);
      window.removeEventListener('postUploadFailed', handlePostFailed as EventListener);
    };
  }, []);

  const addOptimisticPost = (post: OptimisticPost) => {
    setOptimisticPosts(prev => [post, ...prev]);
  };

  const removeOptimisticPost = (postId: string) => {
    setOptimisticPosts(prev => prev.filter(post => post.id !== postId));
  };

  return {
    optimisticPosts,
    addOptimisticPost,
    removeOptimisticPost
  };
};

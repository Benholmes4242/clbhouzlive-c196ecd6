import { useState, useCallback } from 'react';

interface PostData {
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
  }[];
  post_tags?: any[];
  golfCourse?: {
    id: string;
    name: string;
    country: string;
    region?: string;
  };
}

interface UsePostViewerProps {
  source?: 'clubhouse' | 'profile' | 'explore' | 'index';
}

export const usePostViewer = ({ source = 'clubhouse' }: UsePostViewerProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<PostData | null>(null);
  const [allUserPosts, setAllUserPosts] = useState<PostData[]>([]);

  const openPostViewer = useCallback((post: PostData, userPosts: PostData[] = []) => {
    // Only allow opening from clubhouse, profile, and index sources
    if (source !== 'clubhouse' && source !== 'profile' && source !== 'index') {
      return;
    }

    setCurrentPost(post);
    setAllUserPosts(userPosts.length > 0 ? userPosts : [post]);
    setIsOpen(true);
  }, [source]);

  const closePostViewer = useCallback(() => {
    setIsOpen(false);
    setCurrentPost(null);
    setAllUserPosts([]);
  }, []);

  const canOpenViewer = source === 'clubhouse' || source === 'profile' || source === 'index';

  return {
    isOpen,
    currentPost,
    allUserPosts,
    openPostViewer,
    closePostViewer,
    canOpenViewer
  };
};
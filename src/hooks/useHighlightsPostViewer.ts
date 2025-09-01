import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

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

interface HighlightData {
  id: string;
  content: string | null;
  created_at: string;
  post_media: {
    id: string;
    media_type: string;
    media_url: string;
  }[];
  golf_course: {
    id: string;
    name: string;
    country: string;
    global_rank: number | null;
    regional_rank: number | null;
    usa_rank: number | null;
  };
}

// Transform highlight data to post data format
const transformHighlightToPost = (highlight: HighlightData, userId: string): PostData => ({
  id: highlight.id,
  content: highlight.content,
  created_at: highlight.created_at,
  user: {
    id: userId,
    display_name: null,
    username: null,
    profile_photo_url: null
  },
  post_media: highlight.post_media.map(media => ({
    id: media.id,
    media_type: media.media_type as 'image' | 'video',
    media_url: media.media_url
  })),
  post_tags: [],
  golfCourse: {
    id: highlight.golf_course.id,
    name: highlight.golf_course.name,
    country: highlight.golf_course.country,
    region: ''
  }
});

interface UseHighlightsPostViewerProps {
  highlights: HighlightData[];
  userId: string;
}

export const useHighlightsPostViewer = ({ highlights, userId }: UseHighlightsPostViewerProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPost, setCurrentPost] = useState<PostData | null>(null);
  const [allPosts, setAllPosts] = useState<PostData[]>([]);

  // Transform highlights to posts format
  const transformedPosts = highlights
    .map(highlight => transformHighlightToPost(highlight, userId))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Check for URL param on mount and param changes
  useEffect(() => {
    const highlightPostId = searchParams.get('highlightPost');
    if (highlightPostId && highlights.length > 0) {
      const post = transformedPosts.find(p => p.id === highlightPostId);
      if (post) {
        openPostViewer(post.id);
      }
    }
  }, [searchParams, highlights.length, transformedPosts]);

  const openPostViewer = useCallback((postId: string) => {
    const post = transformedPosts.find(p => p.id === postId);
    if (!post) return;

    setCurrentPost(post);
    setAllPosts(transformedPosts);
    setIsOpen(true);
    
    // Add URL param for deep linking
    const newParams = new URLSearchParams(searchParams);
    newParams.set('highlightPost', postId);
    setSearchParams(newParams, { replace: true });
  }, [transformedPosts, searchParams, setSearchParams]);

  const closePostViewer = useCallback(() => {
    setIsOpen(false);
    setCurrentPost(null);
    setAllPosts([]);
    
    // Remove URL param
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('highlightPost');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  return {
    isOpen,
    currentPost,
    allPosts,
    openPostViewer,
    closePostViewer
  };
};
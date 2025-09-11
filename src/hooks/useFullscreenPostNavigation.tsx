import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

import type { MediaItem, PostMediaContext, MediaKind } from '@/types/media';

interface ExtendedMediaItem extends MediaItem {
  golfCourse?: {
    id: string;
    name: string;
    country: string;
  };
  user?: {
    id: string;
    profile_photo_url: string | null;
  };
  displayName?: string;
  content?: string | null;
  postTags?: any[];
  mediaUrls?: string[];
  mediaTypes?: ('image' | 'video')[];
  initialIndex?: number;
  videoPosition?: number;
  videoMuted?: boolean;
}

interface PostData {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    display_name: string | null;
    username: string | null;
    profile_photo_url: string | null;
  };
  post_media: Array<{
    id: string;
    media_url: string;
    media_type: string;
  }>;
  post_tags?: any[];
}

export const useFullscreenPostNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<PostMediaContext | null>(null);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<PostData[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch all posts from a specific user
  const fetchUserPosts = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          post_media(*),
          post_tags(
            id,
            tagged_entity_id,
            tagged_entity:taggable_entities(
              id,
              entity_type,
              entity_id,
              name,
              username
            )
          )
        `)
        .eq('user_id', userId)
        .not('post_media', 'is', null) // Only posts with media
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profile data separately and merge
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Filter posts that have media and add user profile
      const postsWithMedia = posts?.filter(post => post.post_media && post.post_media.length > 0)
        .map(post => ({
          ...post,
          user: userProfile
        })) || [];
      
      setUserPosts(postsWithMedia);
      return postsWithMedia;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      setUserPosts([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Convert post to media context
  const postToMediaItem = useCallback((post: PostData, mediaIndex: number = 0): PostMediaContext => {
    const mediaUrls = post.post_media.map(m => m.media_url);
    const mediaTypes = post.post_media.map(m => m.media_type as 'image' | 'video');
    const items: MediaItem[] = mediaUrls.map((u, i) => ({
      id: `${post.id}-media-${i}`,
      type: mediaTypes[i] || 'image',
      url: u,
      alt: 'Post content'
    }));
    
    return {
      items,
      mediaUrls,
      mediaTypes,
      displayName: post.user.display_name || post.user.username || 'User',
      user: { id: post.user.id, profile_photo_url: post.user.profile_photo_url },
      content: post.content,
      postTags: post.post_tags,
      initialIndex: mediaIndex
    };
  }, []);

  // Open media from a specific post
  const openMedia = useCallback(async (
    url: string | string[], 
    type: 'image' | 'video' | ('image' | 'video')[], 
    alt?: string, 
    golfCourse?: { id: string; name: string; country: string; },
    user?: { id: string; displayName?: string; profile_photo_url?: string | null; },
    displayName?: string,
    content?: string | null,
    postTags?: any[],
    initialIndex: number = 0,
    postId?: string,
    userId?: string,
    videoPosition?: number,
    videoMuted?: boolean
  ) => {
    // Handle both single and multiple media
    const mediaUrls = Array.isArray(url) ? url : [url];
    const mediaTypes = (Array.isArray(type) ? type : [type]) as ('image' | 'video')[];
    const items: MediaItem[] = mediaUrls.map((u, i) => ({
      id: `media-${Date.now()}-${i}`,
      type: mediaTypes[i] || 'image',
      url: u,
      alt
    }));
    
    setCurrentMedia({ 
      items,
      mediaUrls,
      mediaTypes,
      user,
      displayName,
      content,
      postTags,
      golfCourse,
      initialIndex,
      videoPosition,
      videoMuted
    });
    
    setCurrentPostId(postId || null);
    setIsOpen(true);

    // If we have a userId and postId, fetch user posts for navigation
    if (userId && postId) {
      const posts = await fetchUserPosts(userId);
      const postIndex = posts.findIndex(p => p.id === postId);
      setCurrentPostIndex(postIndex >= 0 ? postIndex : 0);
    }
  }, [fetchUserPosts, postToMediaItem]);

  // Navigate to next post
  const goToNextPost = useCallback(() => {
    if (currentPostIndex < userPosts.length - 1) {
      const nextIndex = currentPostIndex + 1;
      const nextPost = userPosts[nextIndex];
      const mediaItem = postToMediaItem(nextPost, 0);
      
      setCurrentMedia(mediaItem);
      setCurrentPostId(nextPost.id);
      setCurrentPostIndex(nextIndex);
    }
  }, [currentPostIndex, userPosts, postToMediaItem]);

  // Navigate to previous post
  const goToPreviousPost = useCallback(() => {
    if (currentPostIndex > 0) {
      const prevIndex = currentPostIndex - 1;
      const prevPost = userPosts[prevIndex];
      const mediaItem = postToMediaItem(prevPost, 0);
      
      setCurrentMedia(mediaItem);
      setCurrentPostId(prevPost.id);
      setCurrentPostIndex(prevIndex);
    }
  }, [currentPostIndex, userPosts, postToMediaItem]);

  const closeMedia = useCallback(() => {
    setIsOpen(false);
    setCurrentMedia(null);
    setCurrentPostId(null);
    setUserPosts([]);
    setCurrentPostIndex(0);
  }, []);

  return {
    isOpen,
    currentMedia,
    userPosts,
    currentPostIndex,
    loading,
    openMedia,
    closeMedia,
    goToNextPost,
    goToPreviousPost,
    canGoNext: currentPostIndex < userPosts.length - 1,
    canGoPrevious: currentPostIndex > 0
  };
};
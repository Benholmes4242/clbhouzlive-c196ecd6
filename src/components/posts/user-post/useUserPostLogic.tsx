import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { useFullscreenMedia } from '@/hooks/useFullscreenMedia';
import { UserPostData, GolfCourse } from './types';
import { extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';

interface UseUserPostLogicProps {
  post: UserPostData;
  allUserPosts: UserPostData[];
  source: 'profile' | 'index';
  onPostDeleted?: () => void;
}

export const useUserPostLogic = ({
  post,
  allUserPosts,
  source,
  onPostDeleted
}: UseUserPostLogicProps) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const [golfCourse, setGolfCourse] = useState<GolfCourse | null>(null);
  const { deletePost } = usePostDeletion();
  
  const { isOpen: isFullscreenOpen, currentMedia, openMedia, closeMedia } = useFullscreenMedia();

  // Computed values
  const displayName = post.user.display_name || post.user.username || 'User';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const isOwnPost = user?.id === post.user.id;
  const golfClubTags = post.post_tags?.filter(tag => tag.entity_type === 'golf_club') || [];

  // Extract golf course from content or tags
  useEffect(() => {
    // First try to extract from post content
    const extractedCourse = extractGolfCourseFromContent(post.content);
    if (extractedCourse) {
      setGolfCourse({
        ...extractedCourse,
        region: extractedCourse.region || ''
      });
      return;
    }

    // Fallback to tags if available
    const fetchGolfCourse = async () => {
      if (golfClubTags.length > 0 && !golfCourse) {
        try {
          const { data: courseData, error } = await supabase
            .from('golf_courses')
            .select('id, name, country, region')
            .eq('id', golfClubTags[0].entity_id)
            .single();

          if (!error && courseData) {
            setGolfCourse(courseData);
          }
        } catch (error) {
          console.error('Error fetching golf course:', error);
        }
      }
    };

    fetchGolfCourse();
  }, [post.content, golfClubTags.length > 0 ? golfClubTags[0]?.entity_id : null]);

  const handleDeletePost = async () => {
    if (!isOwnPost) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    await deletePost(post.id);
    onPostDeleted?.();
  };

  const handleProfileClick = () => {
    navigate(`/profile/${post.user.username}`);
  };

  const handlePostClick = () => {
    // Now handled directly by UserPost component using FullscreenMediaModal
    // This method can be removed or simplified based on the component's needs
  };

  return {
    displayName,
    timeAgo,
    isOwnPost,
    golfCourse,
    handleDeletePost,
    handleProfileClick,
    handlePostClick,
    isFullscreenOpen,
    currentMedia,
    openMedia,
    closeMedia
  };
};
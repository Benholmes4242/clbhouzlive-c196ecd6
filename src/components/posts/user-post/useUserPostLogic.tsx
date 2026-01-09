import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { UserPostData, GolfCourse } from './types';
import { extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { hasGolfCourseReference, getRawCourseId } from '@/utils/resolveGolfCourse';

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

  // Computed values - resolve actor (business or personal)
  const isBusinessPost = post.actor_type === 'business' && post.business;
  
  const displayName = isBusinessPost && post.business
    ? post.business.name
    : (post.user.display_name || post.user.username || 'User');
  
  const avatarUrl = isBusinessPost && post.business
    ? post.business.logo_url
    : post.user.profile_photo_url;
  
  const profilePath = isBusinessPost && post.business
    ? `/business/${post.business.slug || post.business.id}`
    : `/profile/${post.user.username}`;
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const isOwnPost = user?.id === post.user.id;
  const golfClubTags = post.post_tags?.filter(tag => tag.entity_type === 'golf_club') || [];

  // Extract golf course from post.course_id, content, or tags
  // Uses canonical resolver pattern with safety net
  useEffect(() => {
    const fetchGolfCourse = async () => {
      // Get the course ID using canonical helper
      const courseId = getRawCourseId(post);
      
      // Priority 1: Fetch by course_id (from post.course_id or tag)
      if (courseId) {
        try {
          const { data: courseData, error } = await supabase
            .from('golf_courses')
            .select('id, name, country, region')
            .eq('id', courseId)
            .maybeSingle();

          if (!error && courseData) {
            setGolfCourse(courseData);
            return;
          }
          
          // Safety net: if fetch failed but we have the ID, show minimal data
          if (import.meta.env.DEV) {
            console.warn(`[useUserPostLogic] Course fetch failed for ID "${courseId}", using fallback`);
          }
          
          // Try to get name from tag if available
          const tagName = golfClubTags[0]?.name;
          if (tagName) {
            setGolfCourse({ id: courseId, name: tagName, country: '', region: '' });
            return;
          }
        } catch (error) {
          console.error('Error fetching golf course by ID:', error);
        }
      }

      // Priority 2: Extract from post content text (legacy fallback)
      const extractedCourse = extractGolfCourseFromContent(post.content);
      if (extractedCourse) {
        setGolfCourse({
          ...extractedCourse,
          region: extractedCourse.region || ''
        });
      }
    };

    fetchGolfCourse();
  }, [post.course_id, post.content, golfClubTags.length > 0 ? golfClubTags[0]?.entity_id : null]);

  const handleDeletePost = async () => {
    if (!isOwnPost) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    await deletePost(post.id);
    onPostDeleted?.();
  };

  const handleProfileClick = () => {
    navigate(profilePath);
  };

  // Get raw course ID for UI safety net
  const rawCourseId = getRawCourseId(post);
  
  return {
    displayName,
    avatarUrl,
    profilePath,
    isBusinessPost,
    timeAgo,
    isOwnPost,
    golfCourse,
    rawCourseId,
    handleDeletePost,
    handleProfileClick
  };
};
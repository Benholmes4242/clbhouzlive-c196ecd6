import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { UserPostData, GolfCourse } from './types';
import { extractGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { getRawCourseId } from '@/utils/resolveGolfCourse';

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
  const [golfCourses, setGolfCourses] = useState<GolfCourse[]>([]);
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

  // Fetch golf courses from junction table with fallback to legacy course_id
  useEffect(() => {
    const fetchGolfCourses = async () => {
      // First, try to fetch from post_courses junction table
      const { data: junctionData, error: junctionError } = await supabase
        .from('post_courses')
        .select(`
          display_order,
          golf_courses (
            id,
            name,
            country,
            region,
            sub_country
          )
        `)
        .eq('post_id', post.id)
        .order('display_order', { ascending: true });

      if (!junctionError && junctionData && junctionData.length > 0) {
        const courses = junctionData
          .map(pc => pc.golf_courses as unknown as GolfCourse)
          .filter(Boolean);
        setGolfCourses(courses);
        return;
      }

      // Fallback: Use legacy course_id or tags
      const courseId = getRawCourseId(post);
      
      if (courseId) {
        try {
          const { data: courseData, error } = await supabase
            .from('golf_courses')
            .select('id, name, country, region, sub_country')
            .eq('id', courseId)
            .maybeSingle();

          if (!error && courseData) {
            setGolfCourses([courseData]);
            return;
          }
          
          if (import.meta.env.DEV) {
            console.warn(`[useUserPostLogic] Course fetch failed for ID "${courseId}", using fallback`);
          }
          
          const tagName = golfClubTags[0]?.name;
          if (tagName) {
            setGolfCourses([{ id: courseId, name: tagName, country: '', region: '' }]);
            return;
          }
        } catch (error) {
          console.error('Error fetching golf course by ID:', error);
        }
      }

      // Priority 2: Extract from post content text (legacy fallback)
      const extractedCourse = extractGolfCourseFromContent(post.content);
      if (extractedCourse) {
        setGolfCourses([{
          ...extractedCourse,
          region: extractedCourse.region || ''
        }]);
      }
    };

    fetchGolfCourses();
  }, [post.id, post.course_id, post.content, golfClubTags.length > 0 ? golfClubTags[0]?.entity_id : null]);

  const handleDeletePost = async () => {
    if (!isOwnPost) return;

    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    await deletePost(
      post.id,
      post.actor_type as 'personal' | 'business',
      post.actor_id,
      user?.id
    );
    onPostDeleted?.();
  };

  const handleProfileClick = () => {
    navigate(profilePath);
  };

  // Get raw course ID for UI safety net (first course)
  const rawCourseId = getRawCourseId(post);
  
  // Legacy support: return first course as golfCourse for backward compatibility
  const golfCourse = golfCourses.length > 0 ? golfCourses[0] : null;
  
  return {
    displayName,
    avatarUrl,
    profilePath,
    isBusinessPost,
    timeAgo,
    isOwnPost,
    golfCourse,       // Legacy: single course for backward compat
    golfCourses,      // New: array of courses
    rawCourseId,
    handleDeletePost,
    handleProfileClick
  };
};
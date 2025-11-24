import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PostPlayRatingModal from '@/components/courses/PostPlayRatingModal';
import AccessControl from '@/components/AccessControl';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const RateCoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseSession();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      
      const { data, error } = await supabase
        .from('golf_courses')
        .select('id, name, thumbnail_image')
        .eq('id', courseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  // Fetch existing rating for this user/course
  const { data: existingRating } = useQuery({
    queryKey: ['user-course-rating', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user?.id) return null;
      
      const { data } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      return data;
    },
    enabled: !!courseId && !!user,
  });

  const handleClose = () => {
    navigate(-1);
  };

  // Debug logging
  console.log('[Rating Submission Mode]', existingRating ? 'edit' : 'create');
  console.log('[Existing Rating Detected]', !!existingRating);

  return (
    <AccessControl requireAuth={true}>
      {isLoading ? (
        <div className="fixed inset-0 z-50 bg-surface-card flex items-center justify-center">
          <div className="text-center max-w-sm mx-auto px-4">
            <div className="h-12 w-12 rounded-full bg-surface-alt animate-pulse mx-auto mb-3"></div>
            <div className="h-4 w-32 bg-surface-alt animate-pulse mx-auto mb-2 rounded"></div>
            <div className="h-3 w-48 bg-surface-alt animate-pulse mx-auto rounded"></div>
          </div>
        </div>
      ) : (
        <PostPlayRatingModal
          course={course}
          isOpen={true}
          onClose={handleClose}
          isEditMode={!!existingRating}
          existingRating={existingRating}
        />
      )}
    </AccessControl>
  );
};

export default RateCoursePage;

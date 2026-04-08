import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReviewWizard } from '@/components/courses/review-wizard';
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
        .select('id, name, thumbnail_image, country, sub_country, region')
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

  // Check if this review has already been shared to Clubhouse
  const { data: existingShare } = useQuery({
    queryKey: ['review-shared', existingRating?.id],
    queryFn: async () => {
      if (!existingRating?.id) return null;
      const { data } = await supabase
        .from('posts')
        .select('id')
        .eq('source_review_id', existingRating.id)
        .maybeSingle();
      return data;
    },
    enabled: !!existingRating?.id,
  });

  const alreadyShared = !!existingShare;

  // Freeze isEditMode and previousRating at mount so they survive query refetches
  const isEditModeRef = useRef<boolean>(!!existingRating);
  const previousRatingRef = useRef<number | null>(existingRating?.rating ?? null);
  const stableIsEditMode = isEditModeRef.current;
  const stablePreviousRating = previousRatingRef.current;

  const handleClose = () => {
    // Set flag in sessionStorage to trigger highlight on next reviews tab view
    if (courseId) {
      sessionStorage.setItem(`highlight-review-${courseId}`, 'true');
    }
    
    // Pop the Rate Course page off the history stack
    // Check if there's history to go back to (handles direct URL access edge case)
    const hasHistory = window.history.state && window.history.state.idx > 0;
    
    if (hasHistory) {
      navigate(-1);
    } else {
      // Fallback if user landed here directly via URL
      navigate(`/courses/${courseId}`, { replace: true });
    }
  };


  return (
    <AccessControl requireAuth={true} noBlockingLoader={true}>
      <ReviewWizard
        course={course}
        isOpen={true}
        onClose={handleClose}
        isEditMode={stableIsEditMode}
        alreadyShared={alreadyShared}
        existingRating={existingRating}
      />
    </AccessControl>
  );
};

export default RateCoursePage;

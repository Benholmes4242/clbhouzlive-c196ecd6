import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PostPlayRatingModal from '@/components/courses/PostPlayRatingModal';
import AccessControl from '@/components/AccessControl';

const RateCoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

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

  const handleClose = () => {
    navigate(-1);
  };

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
          isEditMode={false}
        />
      )}
    </AccessControl>
  );
};

export default RateCoursePage;

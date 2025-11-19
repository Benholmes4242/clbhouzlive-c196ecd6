import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PostPlayRatingModal from '@/components/courses/PostPlayRatingModal';

/**
 * RateCoursePage - Full-screen page for rating a golf course
 * Converted from modal to page, maintains exact same styling/behavior
 */
export default function RateCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch course data
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
    // Navigate back to course detail page or previous page
    if (location.state?.from) {
      navigate(location.state.from, { replace: true });
    } else if (courseId) {
      navigate(`/courses/${courseId}`, { replace: true });
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[999] bg-surface-card flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-accent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="fixed inset-0 z-[999] bg-surface-card flex items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999]">
      <PostPlayRatingModal
        course={course}
        isOpen={true}
        onClose={handleClose}
        isEditMode={false}
      />
    </div>
  );
}

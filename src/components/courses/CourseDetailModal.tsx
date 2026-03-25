import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import CourseDetailHeader from './CourseDetailHeader';
import CourseDetailImage from './CourseDetailImage';
import CourseDetailInfo from './CourseDetailInfo';
import CourseDetailRatingSection from './CourseDetailRatingSection';
import CourseRatingStats from './CourseRatingStats';
import CourseReviews from './CourseReviews';
import { ReviewWizard } from './review-wizard';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
  continent?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  description?: string;
  thumbnail_image?: string;
  latitude?: number | null;
  longitude?: number | null;
  website_url?: string | null;
}

interface CourseDetailModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  viewingUserId?: string;
  showUserRating?: boolean;
  userRating?: number | null;
  isFromUserCoursesPage?: boolean; // New prop to indicate if opened from a user's courses page
}

const CourseDetailModal = ({ 
  course, 
  isOpen, 
  onClose, 
  viewingUserId,
  showUserRating = false,
  userRating,
  isFromUserCoursesPage = false
}: CourseDetailModalProps) => {
  const { user } = useSupabaseSession();
  const [showRatingModal, setShowRatingModal] = React.useState(false);

  const { data: currentUserResponse } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      return await supabase.auth.getUser();
    },
  });

  const currentUser = currentUserResponse?.data?.user;
  const isViewingOtherUser = viewingUserId && viewingUserId !== currentUser?.id;

  const { data: userCourse } = useQuery({
    queryKey: ['user-course', course?.id, viewingUserId || currentUser?.id],
    queryFn: async () => {
      const userId = viewingUserId || currentUser?.id;
      if (!userId || !course?.id) return null;

      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!(viewingUserId || currentUser?.id) && !!course?.id,
  });

  // In ratings-only system, we use userRatingData to determine if played
  // No need for separate userTop100Course query

  // Use unified rating aggregates hook
  const { data: ratingAggregates } = useCourseRatingAggregates(course?.id);
  
  // Adapt aggregates to legacy format for CourseDetailRatingSection
  const ratingStats = React.useMemo(() => {
    if (!ratingAggregates) return null;
    return {
      average_rating: ratingAggregates.avg_overall_score ?? 0,
      total_ratings: ratingAggregates.review_count ?? 0,
    };
  }, [ratingAggregates]);

  const { data: userRatingData } = useQuery({
    queryKey: ['user-course-rating', course?.id, viewingUserId || currentUser?.id],
    queryFn: async () => {
      const userId = viewingUserId || currentUser?.id;
      if (!userId || !course?.id) return null;

      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!(viewingUserId || currentUser?.id) && !!course?.id,
  });

  const handleAddToPlayed = () => {
    setShowRatingModal(true);
  };

  const handleEditRating = () => {
    setShowRatingModal(true);
  };

  // Ratings-only: played = has rating
  const isAlreadyPlayed = isFromUserCoursesPage || userCourse?.played || !!userRatingData;
  const canModify = user && !isViewingOtherUser;

  if (!course) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <CourseDetailHeader course={course} />

          <div className="space-y-6">
            <CourseDetailImage 
              courseId={course.id}
              thumbnailImage={course.thumbnail_image} 
              courseName={course.name}
              showUserRating={showUserRating}
              userRating={userRating}
            />

            {/* Community Rating moved above About This Course for better visibility */}
            <CourseRatingStats courseId={course.id} />

            {/* About This Course section with Add to My Played button */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">About This Course</h2>
              
              {user && (
                <div>
                  {!isAlreadyPlayed ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddToPlayed}
                      disabled={!canModify}
                      className="flex items-center gap-2 text-green-700 border-green-300 hover:bg-green-50"
                    >
                      <Target className="h-4 w-4" />
                      Add to My Played
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={canModify ? handleEditRating : undefined}
                      disabled={!canModify}
                      className="flex items-center gap-2 text-green-700 border-green-300 bg-green-50 cursor-pointer disabled:cursor-default"
                    >
                      <Target className="h-4 w-4" />
                      Played
                    </Button>
                  )}
                </div>
              )}
            </div>

            <CourseDetailInfo 
              description={course.description}
            />

            {/* Show rating form only if user is viewing their own profile and has played the course */}
            {!isViewingOtherUser && isAlreadyPlayed && (
              <CourseDetailRatingSection
                courseId={course.id}
                courseName={course.name}
                ratingStats={ratingStats}
                currentUser={currentUser}
                userCourse={userCourse}
                userRating={userRatingData}
              />
            )}

            <CourseReviews 
              courseId={course.id} 
              courseName={course.name}
              currentUser={currentUser}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Modal */}
      <ReviewWizard
        course={course}
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        isEditMode={isAlreadyPlayed}
      />
    </>
  );
};

export default CourseDetailModal;

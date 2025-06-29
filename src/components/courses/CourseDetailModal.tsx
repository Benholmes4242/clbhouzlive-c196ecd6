
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import CourseDetailHeader from './CourseDetailHeader';
import CourseDetailImage from './CourseDetailImage';
import CourseDetailInfo from './CourseDetailInfo';
import CourseDetailRatingSection from './CourseDetailRatingSection';
import CourseRatingStats from './CourseRatingStats';
import CourseReviews from './CourseReviews';
import CourseDetailMapSection from './CourseDetailMapSection';
import CoursePlayedButton from './CoursePlayedButton';

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
}

const CourseDetailModal = ({ course, isOpen, onClose, viewingUserId }: CourseDetailModalProps) => {
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

  const { data: ratingStats } = useQuery({
    queryKey: ['course-rating-stats', course?.id],
    queryFn: async () => {
      if (!course?.id) return null;

      const { data, error } = await supabase
        .from('course_ratings')
        .select('rating, review')
        .eq('course_id', course.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      const totalRatings = data.length;
      const averageRating = data.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings;
      const totalReviews = data.filter(r => r.review && r.review.trim() !== '').length;

      return {
        average_rating: Math.round(averageRating * 100) / 100,
        total_ratings: totalRatings,
        total_reviews: totalReviews
      };
    },
    enabled: !!course?.id,
  });

  const { data: userRating } = useQuery({
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

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  if (!course) return null;

  const canModifyCourseStatus = currentUser && !isViewingOtherUser;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Custom close button with proper event handling */}
        <button
          onClick={handleCloseClick}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50 bg-background"
          style={{ zIndex: 9999 }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <CourseDetailHeader course={course} />

        <div className="space-y-6">
          <CourseDetailImage 
            thumbnailImage={course.thumbnail_image} 
            courseName={course.name}
            globalRank={course.global_rank}
            regionalRank={course.regional_rank}
            usaRank={course.usa_rank}
            country={course.country}
          />

          <CourseDetailInfo 
            region={course.region}
            country={course.country}
            sub_country={course.sub_country}
            description={course.description}
          />

          {/* Mark as Played Button - show only if user is logged in and viewing their own profile */}
          {canModifyCourseStatus && (
            <div className="flex justify-center">
              <CoursePlayedButton
                courseId={course.id}
                courseName={course.name}
                userCourse={userCourse}
                canModifyCourseStatus={true}
                currentUserId={currentUser?.id}
                course={course}
                showButton={true}
                variant="standalone"
              />
            </div>
          )}

          {/* Show rating stats for everyone */}
          <CourseRatingStats ratingStats={ratingStats} />

          {/* Show rating form only if user is viewing their own profile and has played the course */}
          {!isViewingOtherUser && userCourse?.played && (
            <CourseDetailRatingSection
              courseId={course.id}
              courseName={course.name}
              ratingStats={ratingStats}
              currentUser={currentUser}
              userCourse={userCourse}
              userRating={userRating}
            />
          )}

          <CourseReviews 
            courseId={course.id} 
            courseName={course.name}
            currentUser={currentUser}
          />

          <CourseDetailMapSection
            latitude={course.latitude}
            longitude={course.longitude}
            courseName={course.name}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailModal;

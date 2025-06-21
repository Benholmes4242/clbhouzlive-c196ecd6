
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import CourseDetailHeader from './CourseDetailHeader';
import CourseDetailImage from './CourseDetailImage';
import CourseDetailInfo from './CourseDetailInfo';
import CourseDetailRatingSection from './CourseDetailRatingSection';
import CourseReviews from './CourseReviews';
import CourseDetailMapSection from './CourseDetailMapSection';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
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
}

const CourseDetailModal = ({ course, isOpen, onClose }: CourseDetailModalProps) => {
  const { data: currentUserResponse } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      return await supabase.auth.getUser();
    },
  });

  const currentUser = currentUserResponse?.data?.user;

  const { data: userCourse } = useQuery({
    queryKey: ['user-course', course?.id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id || !course?.id) return null;

      const { data, error } = await supabase
        .from('user_courses')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!(currentUser?.id && course?.id),
  });

  const { data: ratingStats } = useQuery({
    queryKey: ['course-rating-stats', course?.id],
    queryFn: async () => {
      if (!course?.id) return null;

      const { data, error } = await supabase
        .from('course_rating_stats')
        .select('*')
        .eq('course_id', course.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!course?.id,
  });

  const { data: userRating } = useQuery({
    queryKey: ['user-course-rating', course?.id, currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id || !course?.id) return null;

      const { data, error } = await supabase
        .from('course_ratings')
        .select('*')
        .eq('course_id', course.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!(currentUser?.id && course?.id),
  });

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <CourseDetailHeader course={course} />

        <div className="space-y-6">
          <CourseDetailImage 
            thumbnailImage={course.thumbnail_image} 
            courseName={course.name} 
          />

          <CourseDetailInfo 
            region={course.region}
            country={course.country}
            description={course.description}
          />

          <CourseDetailRatingSection
            courseId={course.id}
            courseName={course.name}
            ratingStats={ratingStats}
            currentUser={currentUser}
            userCourse={userCourse}
            userRating={userRating}
          />

          <CourseReviews courseId={course.id} />

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

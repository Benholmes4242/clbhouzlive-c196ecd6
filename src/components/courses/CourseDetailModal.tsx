
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Users } from 'lucide-react';
import CourseRatingSystem from './CourseRatingSystem';
import CourseReviews from './CourseReviews';
import CourseMap from './CourseMap';

interface Course {
  id: string;
  name: string;
  country: string;
  region: string;
  continent: string;
  global_rank: number | null;
  regional_rank: number | null;
  usa_rank: number | null;
  description: string;
  thumbnail_image: string;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
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

  const canRate = currentUser && userCourse?.played;
  const hasRated = !!userRating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{course.name}</span>
            {course.global_rank && (
              <Badge variant="secondary">#{course.global_rank} Global</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Image */}
          {course.thumbnail_image && (
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={course.thumbnail_image}
                alt={course.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{course.region}, {course.country}</span>
          </div>

          {/* Description */}
          {course.description && (
            <div>
              <h3 className="font-semibold mb-2">About This Course</h3>
              <p className="text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </div>
          )}

          {/* Average Rating Display */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Community Rating</h3>
            
            {ratingStats ? (
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="text-2xl font-bold">{ratingStats.average_rating}/10</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{ratingStats.total_ratings} ratings</span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground mb-4">
                No ratings yet. Be the first to rate this course!
              </div>
            )}

            {canRate ? (
              <CourseRatingSystem
                courseId={course.id}
                courseName={course.name}
                currentRating={userRating?.rating || null}
                currentReview={userRating?.review || null}
                hasRated={hasRated}
              />
            ) : !currentUser ? (
              <p className="text-sm text-muted-foreground">
                Sign in to rate this course
              </p>
            ) : !userCourse?.played ? (
              <p className="text-sm text-muted-foreground">
                Mark this course as played to rate it
              </p>
            ) : null}
          </div>

          {/* Reviews Section */}
          <CourseReviews courseId={course.id} />

          {/* Map */}
          {course.latitude && course.longitude && (
            <div>
              <h3 className="font-semibold mb-3">Location</h3>
              <CourseMap
                latitude={course.latitude}
                longitude={course.longitude}
                courseName={course.name}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailModal;

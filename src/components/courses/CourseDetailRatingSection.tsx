
import React from 'react';
import { Users } from 'lucide-react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import CourseRatingSystem from './CourseRatingSystem';

interface RatingStats {
  average_rating: number;
  total_ratings: number;
}

interface UserRating {
  rating: number;
  review?: string;
}

interface UserCourse {
  played: boolean;
}

interface CourseDetailRatingSectionProps {
  courseId: string;
  courseName: string;
  ratingStats: RatingStats | null;
  currentUser: any;
  userCourse: UserCourse | null;
  userRating: UserRating | null;
}

const CourseDetailRatingSection = ({
  courseId,
  courseName,
  ratingStats,
  currentUser,
  userCourse,
  userRating
}: CourseDetailRatingSectionProps) => {
  const canRate = currentUser && userCourse?.played;
  const hasRated = !!userRating;

  // If user has already rated, don't show this section
  if (hasRated) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Community Rating</h3>
      
      {ratingStats ? (
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <ClubhouseLogo size="md" showTooltip />
            <span className="text-2xl font-bold">{ratingStats.average_rating}</span>
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
          courseId={courseId}
          courseName={courseName}
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
  );
};

export default CourseDetailRatingSection;

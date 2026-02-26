/**
 * PersonalSection - Container for all Phase 5 personal components
 * Unified section for the course detail page
 */
import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import CourseStatusToggle from './CourseStatusToggle';
import PersonalReviewCard from './PersonalReviewCard';
import CourseMoments from './CourseMoments';
import PlanningSignals from './PlanningSignals';
import { Skeleton } from '@/components/ui/skeleton';

interface PersonalSectionProps {
  courseId: string;
  courseName: string;
  className?: string;
}

export const PersonalSection: React.FC<PersonalSectionProps> = ({
  courseId,
  courseName,
  className,
}) => {
  const { user } = useSupabaseSession();
  const { data: userRating, isLoading: ratingLoading } = useUserCourseRating(courseId, user?.id);
  const { status, isLoading: statusLoading } = useCoursePersonalStatus(courseId);

  // Show nothing if no user
  if (!user) {
    return null;
  }

  const isLoading = ratingLoading || statusLoading;
  const hasPlayed = status.status === 'played';
  const hasIntent = status.status === 'want_to_play';

  if (isLoading) {
    return (
      <section className={cn("px-4 py-5 bg-white space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </section>
    );
  }

  return (
    <section className={cn("px-4 py-5 bg-card space-y-5", className)}>
      {/* Section header */}
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">Your Journey</h3>
      </div>

      {/* Status toggle - always show */}
      <CourseStatusToggle courseId={courseId} courseName={courseName} userRating={userRating?.rating} />

      {/* Personal review card - only if played */}
      {hasPlayed && userRating && (
        <PersonalReviewCard courseId={courseId} rating={userRating} />
      )}

      {/* Course moments - only if played */}
      {hasPlayed && (
        <CourseMoments courseId={courseId} courseName={courseName} />
      )}

      {/* Planning signals - only if NOT played */}
      {!hasPlayed && (
        <PlanningSignals courseId={courseId} courseName={courseName} />
      )}
    </section>
  );
};

export default PersonalSection;

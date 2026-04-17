/**
 * PersonalSection - Container for all Phase 5 personal components
 */
import React from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import CourseStatusToggle from './CourseStatusToggle';
import PersonalReviewCard from './PersonalReviewCard';
import CourseMoments from './CourseMoments';

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

  if (!user) return null;

  const isLoading = ratingLoading || statusLoading;
  const hasPlayed = status.status === 'played';

  if (isLoading) {
    return (
      <section style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ height: 18, width: 120, background: 'rgba(15,23,42,0.06)', borderRadius: 4 }} />
        <div style={{ height: 96, width: '100%', background: 'rgba(15,23,42,0.06)', borderRadius: 12 }} />
      </section>
    );
  }

  return (
    <section style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Section header — plain bold, no icon */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>
          Your Journey
        </h3>
      </div>

      {/* Status toggle */}
      <CourseStatusToggle courseId={courseId} courseName={courseName} userRating={userRating?.rating} />

      {/* Personal review card — only if played */}
      {hasPlayed && userRating && (
        <PersonalReviewCard courseId={courseId} rating={userRating} />
      )}

      {/* Course moments — only if played */}
      {hasPlayed && (
        <CourseMoments courseId={courseId} courseName={courseName} />
      )}
    </section>
  );
};

export default PersonalSection;

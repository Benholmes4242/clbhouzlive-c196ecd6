/**
 * PersonalSection - Container for all Phase 5 personal components.
 * Carries the single "Your journey" kicker for the whole block.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserCourseRating } from '@/hooks/useUserCourseRating';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { useCourseRatingAggregates } from '@/hooks/useCourseRatingAggregates';
import CourseStatusToggle from './CourseStatusToggle';
import PersonalReviewCard from './PersonalReviewCard';
import CourseMoments from './CourseMoments';
import { KICKER } from '@/features/courses/components/holes/analytical/tokens';



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
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const { data: userRating, isLoading: ratingLoading } = useUserCourseRating(courseId, user?.id);
  const { status, isLoading: statusLoading } = useCoursePersonalStatus(courseId);
  const { data: aggregates } = useCourseRatingAggregates(courseId);
  const communityAverage = aggregates?.avg_overall_score ?? null;


  if (!user) return null;

  const isLoading = ratingLoading || statusLoading;
  const hasPlayed = status?.status === 'played';

  if (isLoading) {
    return (
      <section style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ height: 18, width: 120, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }} />
        <div style={{ height: 96, width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: 12 }} />
      </section>
    );
  }

  return (
    <section style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ONE kicker for the whole journey block; panel titles carry the rest. */}
      <div style={KICKER}>{t('courseDetail.you.journey')}</div>

      <CourseStatusToggle courseId={courseId} courseName={courseName} userRating={userRating?.rating} />

      {/* Personal review card — only if played */}
      {hasPlayed && userRating && (
        <PersonalReviewCard courseId={courseId} rating={userRating} communityAverage={communityAverage} />
      )}

      {/* Course moments — only if played */}
      {hasPlayed && <CourseMoments courseId={courseId} courseName={courseName} />}
    </section>
  );
};


export default PersonalSection;

import React from 'react';
import type { PlayedCourseRow } from '@/hooks/gam/useUserPlayedCourses';
import type { LegendCategory } from '@/lib/gam/types';
import type { CourseLegendHolderRow } from '@/hooks/gam/useCourseLegendHolders';
import { Skeleton, EmptyStub } from '../../../../gam/_shared/GamAtoms';
import CollapsibleSubsection from '../_shared/CollapsibleSubsection';
import CourseLegendsCard from '../CourseLegendsCard';
import type { CourseSelection } from '../types';

interface Props {
  courses: PlayedCourseRow[];
  isLoading: boolean;
  holdersByCourse: Map<string, Map<LegendCategory, CourseLegendHolderRow>>;
  onSelectCourse: (c: CourseSelection) => void;
  friendName?: string | null;
}

export const YourCoursesSubsection: React.FC<Props> = ({
  courses,
  isLoading,
  holdersByCourse,
  onSelectCourse,
  friendName,
}) => {
  // Only render cards for courses that have data in the active window.
  const populatedCourses = courses.filter(
    (c) => (holdersByCourse.get(c.course_id)?.size ?? 0) > 0,
  );

  // Hide entire subsection when user has played courses but none are populated in the active window.
  if (!isLoading && courses.length > 0 && populatedCourses.length === 0) {
    return null;
  }

  return (
    <>
      <SubsectionEyebrow label="YOUR COURSES" />
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading && <Skeleton height={220} radius={14} />}
        {!isLoading && courses.length === 0 && (
          <EmptyStub
            title="No other courses yet"
            body="Courses you've played outside your home club will show here."
          />
        )}
        {populatedCourses.map((c) => (
          <CourseLegendsCard
            key={c.course_id}
            courseId={c.course_id}
            courseName={c.course_name}
            courseType={c.course_type}
            courseRegion={c.course_region}
            courseCountry={c.course_country}
            courseHeaderImage={c.course_header_image ?? null}
            holdersByCategory={holdersByCourse.get(c.course_id) ?? new Map()}
            friendName={friendName}
            onTap={() =>
              onSelectCourse({
                courseId: c.course_id,
                courseName: c.course_name,
                courseRegion: c.course_region,
                courseCountry: c.course_country,
                courseType: c.course_type,
              })
            }
          />
        ))}
      </div>
    </>
  );
};

export default YourCoursesSubsection;

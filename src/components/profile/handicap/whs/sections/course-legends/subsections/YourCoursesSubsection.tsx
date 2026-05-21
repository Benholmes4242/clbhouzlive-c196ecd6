import React from 'react';
import type { PlayedCourseRow } from '@/hooks/gam/useUserPlayedCourses';
import type { LegendCategory } from '@/lib/gam/types';
import type { CourseLegendHolderRow } from '@/hooks/gam/useCourseLegendHolders';
import { Skeleton, EmptyStub } from '../../../../gam/_shared/GamAtoms';
import SubsectionEyebrow from '../_shared/SubsectionEyebrow';
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
        {courses.map((c) => (
          <CourseLegendsCard
            key={c.course_id}
            courseId={c.course_id}
            courseName={c.course_name}
            courseType={c.course_type}
            courseRegion={c.course_region}
            courseCountry={c.course_country}
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

import React from 'react';
import type { DiscoverCourseRow } from '@/hooks/gam/useDiscoverCoursesThisWeek';
import type { LegendCategory } from '@/lib/gam/types';
import type { CourseLegendHolderRow } from '@/hooks/gam/useCourseLegendHolders';
import { Skeleton, EmptyStub } from '../../../../gam/_shared/GamAtoms';
import CollapsibleSubsection from '../_shared/CollapsibleSubsection';
import CourseLegendsCard from '../CourseLegendsCard';
import type { CourseSelection } from '../types';

interface Props {
  courses: DiscoverCourseRow[];
  isLoading: boolean;
  holdersByCourse: Map<string, Map<LegendCategory, CourseLegendHolderRow>>;
  onSelectCourse: (c: CourseSelection) => void;
  friendName?: string | null;
}

export const DiscoverSubsection: React.FC<Props> = ({
  courses,
  isLoading,
  holdersByCourse,
  onSelectCourse,
  friendName,
}) => {
  const countLabel =
    courses.length > 0
      ? `${courses.length} new course${courses.length === 1 ? '' : 's'} to claim`
      : undefined;

  return (
    <CollapsibleSubsection title="Discover this week" subtitle={countLabel} icon="🔍">
      <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading && <Skeleton height={220} radius={14} />}
        {!isLoading && courses.length === 0 && (
          <EmptyStub
            title="Nothing trending yet"
            body="Hot legend chases at courses across the network will surface here."
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
    </CollapsibleSubsection>
  );
};

export default DiscoverSubsection;

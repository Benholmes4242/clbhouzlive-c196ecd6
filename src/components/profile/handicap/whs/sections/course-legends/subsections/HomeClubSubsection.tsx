import React from 'react';
import { useUserHomeClubCourses } from '@/hooks/gam/useUserHomeClubCourses';
import type { LegendCategory } from '@/lib/gam/types';
import type { CourseLegendHolderRow } from '@/hooks/gam/useCourseLegendHolders';
import { Skeleton, EmptyStub } from '../../../../gam/_shared/GamAtoms';
import SubsectionEyebrow from '../_shared/SubsectionEyebrow';
import CourseLegendsCard from '../CourseLegendsCard';
import type { CourseSelection } from '../types';

interface Props {
  userId: string;
  holdersByCourse: Map<string, Map<LegendCategory, CourseLegendHolderRow>>;
  onSelectCourse: (c: CourseSelection) => void;
  friendName?: string | null;
}

export const HomeClubSubsection: React.FC<Props> = ({
  userId,
  holdersByCourse,
  onSelectCourse,
  friendName,
}) => {
  const query = useUserHomeClubCourses(userId);
  const courses = query.data ?? [];
  const homeClubName = courses[0]?.home_club_name ?? null;

  if (query.isLoading) {
    return (
      <>
        <SubsectionEyebrow label="HOME CLUB" />
        <div style={{ padding: '0 16px' }}>
          <Skeleton height={220} radius={14} />
        </div>
      </>
    );
  }

  if (!homeClubName && courses.length === 0) {
    return (
      <>
        <SubsectionEyebrow label="HOME CLUB" />
        <div style={{ padding: '0 16px' }}>
          <EmptyStub
            title="No home club set"
            body="Add your home club in profile settings to see your home leaderboards here."
          />
        </div>
      </>
    );
  }

  if (homeClubName && courses.length === 0) {
    return (
      <>
        <SubsectionEyebrow label={`HOME CLUB · ${homeClubName.toUpperCase()}`} />
        <div style={{ padding: '0 16px' }}>
          <EmptyStub
            title="Courses not found"
            body={`We couldn't match courses for "${homeClubName}" — try searching below.`}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SubsectionEyebrow label={`HOME CLUB · ${(homeClubName || '').toUpperCase()}`} />
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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

export default HomeClubSubsection;

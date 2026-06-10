import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';
import { CourseLegendsDrilldown } from '@/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown';
import { PageRoot } from '@/components/layout/PageRoot';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import type { CourseSelection } from '@/components/profile/handicap/whs/sections/course-legends/types';

/**
 * Standalone page for a single course's legends (Compete-tab drilldown).
 *
 * LIGHT page — matches the course-detail Legends tab so the now-light Chase
 * drilldown reads correctly. `.hcp-light` wrapper ensures every `var(--hcp-*)`
 * inside the drilldown resolves to the light palette.
 */
export const CourseLegendsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: meta, isLoading: metaLoading } = useCourseMeta(courseId);

  if (!courseId) {
    navigate('/handicap?subtab=compete', { replace: true });
    return null;
  }

  if (metaLoading || !meta) {
    return (
      <PageRoot dark={false} style={{ background: '#F8FAFC' }}>
        <main
          className="hcp-light"
          style={{ paddingTop: 'var(--chrome-total-h, 0px)', background: '#F8FAFC', minHeight: '100vh' }}
        >
          <ProfileSkeleton />
        </main>
      </PageRoot>
    );
  }

  const selection: CourseSelection = {
    courseId,
    courseName: meta.course_name ?? 'Course',
    courseRegion: meta.course_region,
    courseCountry: meta.course_country,
    courseType: meta.course_type,
  };

  return (
    <PageRoot dark={false} style={{ background: '#F8FAFC' }}>
      <main
        className="hcp-light"
        style={{ paddingTop: 'var(--chrome-total-h, 0px)', background: '#F8FAFC', minHeight: '100vh' }}
      >
        <CourseLegendsDrilldown selection={selection} />
      </main>
    </PageRoot>
  );
};

export default CourseLegendsPage;

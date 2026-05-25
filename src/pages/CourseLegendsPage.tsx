import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';
import { CourseLegendsDrilldown } from '@/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown';
import { PageRoot } from '@/components/layout/PageRoot';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import type { CourseSelection } from '@/components/profile/handicap/whs/sections/course-legends/types';

/**
 * Standalone page for a single course's legends.
 * URL: /handicap/legends/courses/:courseId
 *
 * NOTE: Does NOT use ShellSlot. ShellSlot is for tab nav / pinned chrome
 * below the CompactHeader. This page has no tab nav. The CompactHeader still
 * renders automatically because GlobalHeader is mounted at the App level.
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
      <PageRoot dark style={{ background: 'var(--hcp-bg-0)' }}>
        <main style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
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
    <PageRoot dark style={{ background: 'var(--hcp-bg-0)' }}>
      <main style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
        <CourseLegendsDrilldown selection={selection} />
      </main>
    </PageRoot>
  );
};

export default CourseLegendsPage;

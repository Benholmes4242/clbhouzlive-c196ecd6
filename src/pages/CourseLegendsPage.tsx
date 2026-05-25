import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseMeta } from '@/hooks/gam/useCourseMeta';
import { CourseLegendsDrilldown } from '@/components/profile/handicap/whs/sections/course-legends/CourseLegendsDrilldown';
import { PageRoot } from '@/components/layout/PageRoot';
import { ShellSlot } from '@/components/header/ShellSlot';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import type { CourseSelection } from '@/components/profile/handicap/whs/sections/course-legends/types';

/**
 * Standalone page for a single course's legends.
 * URL: /handicap/legends/courses/:courseId
 *
 * Replaces the in-state drilldown that previously lived inside LegendsView.
 * The header back chevron handles navigation back to the Compete tab via
 * the standard CompactHeader handicap-route logic (safeGoBack → /handicap).
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
      <ShellSlot dark>
        <PageRoot dark style={{ background: 'var(--hcp-bg-0)' }}>
          <ProfileSkeleton />
        </PageRoot>
      </ShellSlot>
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
    <ShellSlot dark>
      <PageRoot dark style={{ background: 'var(--hcp-bg-0)' }}>
        <CourseLegendsDrilldown selection={selection} />
      </PageRoot>
    </ShellSlot>
  );
};

export default CourseLegendsPage;

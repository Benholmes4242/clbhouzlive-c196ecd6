import { lazy, Suspense } from 'react';
import ExploreGridSkeleton from '@/components/explore-tab-new/ExploreGridSkeleton';

const CoursesTabContent = lazy(() => import('@/components/courses-tab/CoursesTabContent'));

export default function NewCoursesTab() {
  return (
    <Suspense fallback={<ExploreGridSkeleton />}>
      <CoursesTabContent embedded />
    </Suspense>
  );
}

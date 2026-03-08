import React, { useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCourseMedia, type CourseMediaFilter } from './hooks/useCourseMedia';
import { CourseMediaHeader } from './CourseMediaHeader';
import { CourseMediaGrid } from './CourseMediaGrid';
import { CourseMediaAutoplay } from './CourseMediaAutoplay';

interface CourseMediaTabNewProps {
  courseId: string;
  courseName?: string;
}

const CourseMediaTabNew: React.FC<CourseMediaTabNewProps> = ({ courseId, courseName }) => {
  const { user } = useSupabaseSession();
  const [activeFilter, setActiveFilter] = useState<CourseMediaFilter>('all');

  const {
    posts,
    mediaCounts,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    resetSeen,
  } = useCourseMedia({
    userId: user?.id,
    courseId,
    filter: activeFilter,
  });

  const handleFilterChange = (filter: CourseMediaFilter) => {
    setActiveFilter(filter);
    resetSeen();
  };

  const gridRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col">
      <CourseMediaHeader
        mediaCounts={mediaCounts}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        courseId={courseId}
      />
      <CourseMediaGrid
        ref={gridRef}
        posts={posts}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage ?? false}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
        courseName={courseName}
      />
      <CourseMediaAutoplay posts={posts} gridRef={gridRef as React.RefObject<HTMLDivElement>} />
    </div>
  );
};

export default CourseMediaTabNew;

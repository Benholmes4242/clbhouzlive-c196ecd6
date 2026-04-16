import React, { useState } from 'react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useCourseMedia, type CourseMediaFilter } from './hooks/useCourseMedia';
import { CourseMediaHeader } from './CourseMediaHeader';
import { CourseMediaGrid } from './CourseMediaGrid';
import { CourseMediaAutoplay } from './CourseMediaAutoplay';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

interface CourseMediaTabNewProps {
  courseId: string;
  courseName?: string;
}

const CourseMediaTabNew: React.FC<CourseMediaTabNewProps> = ({ courseId, courseName }) => {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
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

  if (!user) {
    return (
      <div className="animate-in fade-in duration-200 flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <Camera className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Sign in to view media</p>
          <p className="mt-1 text-sm text-muted-foreground">
            See photos and videos from golfers who've played here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="h-11 px-6 rounded-xl bg-[#f59e0b] text-white text-sm font-semibold hover:bg-[#e8920f] active:scale-[0.97] transition-all"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-200 flex flex-col" style={{ background: '#F8FAFC', minHeight: '100%' }}>
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
        courseId={courseId}
      />
      <CourseMediaAutoplay posts={posts} gridRef={gridRef as React.RefObject<HTMLDivElement>} />
      <ScrollToTopGlass />
    </div>
  );
};

export default CourseMediaTabNew;

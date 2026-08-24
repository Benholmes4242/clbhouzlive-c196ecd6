import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useCourseMedia, type CourseMediaFilter } from './hooks/useCourseMedia';
import { CourseMediaHeader } from './CourseMediaHeader';
import { CourseMediaCanonGrid } from './CourseMediaCanonGrid';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { SLATE_50 } from '@/features/courses/_shared/tokens';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface CourseMediaTabNewProps {
  courseId: string;
  courseName?: string;
}

const CourseMediaTabNew: React.FC<CourseMediaTabNewProps> = ({ courseId, courseName }) => {
  const { t } = useTranslation(['courses']);
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<CourseMediaFilter>('all');

  const {
    posts,
    postsForFullscreen,
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
          <p className="text-base font-semibold text-foreground">{t('courses:media.signInTitle')}</p>
          <p className="text-sm text-muted-foreground">
            {t('courses:media.signInBody')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/auth')}
          className="h-11 px-6 rounded-xl text-sm font-semibold active:scale-[0.97] transition-all"
          style={{ background: A.INK, color: A.CANVAS }}
        >
          {t('courses:media.signInCta')}
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-200 flex flex-col" style={{ background: SLATE_50, minHeight: '100%' }}>
      <CourseMediaHeader
        mediaCounts={mediaCounts}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        courseId={courseId}
      />
      <CourseMediaCanonGrid
        ref={gridRef}
        posts={posts}
        postsForFullscreen={postsForFullscreen}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage ?? false}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        refetch={refetch}
        courseName={courseName}
        courseId={courseId}
      />
      <ScrollToTopGlass />
    </div>
  );
};

export default CourseMediaTabNew;

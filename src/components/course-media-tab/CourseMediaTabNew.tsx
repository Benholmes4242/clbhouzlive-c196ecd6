import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useCourseMedia, type CourseMediaFilter } from './hooks/useCourseMedia';
import { CourseMediaHeader } from './CourseMediaHeader';
import { CourseMediaCanonGrid } from './CourseMediaCanonGrid';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { useHolePhotoTagging } from './hooks/useHolePhotoTagging';
import { HolePhotoTagDialog, HolePhotoOutcome } from './HolePhotoTagDialog';
import { capitalPhotoCount, spellPhotoCount, photoCoverage, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import type { FeedPost } from '@/components/media-system/types/media';

interface CourseMediaTabNewProps {
  courseId: string;
  courseName?: string;
}

const CourseMediaTabNew: React.FC<CourseMediaTabNewProps> = ({ courseId, courseName }) => {
  const { t } = useTranslation(['courses']);
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<CourseMediaFilter>('all');
  // MEDIA_ENGINE_1_R2: same source as About/You; no resolver or fallback.
  const analysis = useCourseHoleAnalysis(user ? courseId : undefined);
  const knownHoles = analysis.data?.available ? analysis.data.holes.map(hole => hole.hole_no) : null;
  const tagging = useHolePhotoTagging(courseId, user?.id, knownHoles);
  const [tagPost, setTagPost] = useState<FeedPost | null>(null);
  const [tagResult, setTagResult] = useState<HolePhoto | null>(null);

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
  const untaggedCount = tagging.ready ? (tagging.own.data ?? []).filter(url => !tagging.taggedUrls.has(url)).length : null;
  const coverage = knownHoles && tagging.tags.isSuccess ? photoCoverage(knownHoles, tagging.tags.data ?? []) : null;
  const startTag = (post: FeedPost) => { tagging.submit.reset(); setTagResult(null); setTagPost(post); };

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
    <div className="animate-in fade-in duration-200 flex flex-col" style={{ background: A.CANVAS, minHeight: '100%' }}>
      <CourseMediaHeader
        mediaCounts={mediaCounts}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        courseId={courseId}
      />
      {tagging.ready && untaggedCount != null && untaggedCount > 0 && activeFilter !== 'videos' && (
        <section className="px-5 pt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: A.INK }}>Everything else</p>
          <h2 className="mt-1 text-[19px] font-bold">{capitalPhotoCount(untaggedCount)} of yours {untaggedCount === 1 ? 'is' : 'are'} untagged</h2>
        </section>
      )}
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
        tagging={tagging.ready && user && knownHoles ? { memberId: user.id, holeCount: knownHoles.length, taggedUrls: tagging.taggedUrls, onTag: startTag } : undefined}
      />
      {coverage && tagging.ready && activeFilter !== 'videos' && (
        <p className="mx-5 my-4 border-l-2 pl-3 text-[13px] leading-normal" style={{ borderColor: A.BORDER, color: A.BODY }}>
          {capitalPhotoCount(coverage.unphotographed)} of the {spellPhotoCount(coverage.known)} holes we have data for here have never been photographed.
        </p>
      )}
      {tagResult && !tagPost && <div className="mx-5 mb-4"><HolePhotoOutcome row={tagResult} /></div>}
      {tagPost && knownHoles && tagPost.mediaItems[0]?.imageUrl && (
        <HolePhotoTagDialog key={tagPost.mediaItems[0].id} imageUrl={tagPost.mediaItems[0].imageUrl}
          holeCount={knownHoles.length} knownHoleNumbers={knownHoles} usedHoles={(tagging.tags.data ?? []).filter(row => row.user_id === user.id).map(row => row.hole_no)}
          pending={tagging.submit.isPending} result={tagResult}
          error={tagging.submit.error ? 'The photograph could not be tagged. Please try again.' : null}
          onClose={() => setTagPost(null)}
          onSubmit={hole => tagging.submit.mutate({ post: tagPost, hole }, { onSuccess: row => setTagResult(row) })} />
      )}
      <ScrollToTopGlass />
    </div>
  );
};

export default CourseMediaTabNew;

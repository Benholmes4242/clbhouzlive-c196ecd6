import { VERDICT_KICKER, TAB_TITLE } from '@/components/courses/course-detail/about/AboutSection';
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
import { INK_ON_LIGHT } from '@/lib/tokens/surfaces';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { useHolePhotoTagging } from './hooks/useHolePhotoTagging';
import { HolePhotoTagDialog } from './HolePhotoTagDialog';
import { capitalPhotoCount, holeMediaKey, holeSourceUrl, type OwnMediaSource, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { HoleWalk } from './HoleWalk';
import type { FeedPost } from '@/components/media-system/types/media';
import { useQueryClient } from '@tanstack/react-query';
import { useMediaUpload } from '@/uploads/hooks/useMediaUpload';
import { HoleKnownPhotoPath, HolePhotoBatchPath } from './HolePhotoFastPaths';
import { prepareHolePhoto, submitLibraryHolePhoto, submitLibraryHoleVideo, libraryHoleVideoError } from '@/lib/courseMedia/holePhotoData';
import { uploadVideoResilient } from '@/uploads/resilientVideoUpload';
import { pollStreamMetadata } from '@/utils/pollStreamMetadata';
import { orderedBatch, type BatchPhoto } from '@/lib/courseMedia/holePhotoBatch';
import { holePhotoErrorMessage } from '@/lib/courseMedia/holePhotoError';
import { coursePhotoState } from '@/lib/courseMedia/emptyStates';
import { CourseFirstPhotoPicker, CoursePhotoRetagPicker, CourseMediaNoPhotographs, CourseMediaNothing, CourseMediaNoHoleList, CourseMediaNotLive } from './CourseMediaEmptyStates';

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
  const knownHoles = analysis.data?.available ? [...analysis.data.holes].sort((a, b) => a.hole_no - b.hole_no).map(hole => hole.hole_no) : null;
  const tagging = useHolePhotoTagging(courseId, user?.id, knownHoles);
  const [tagPost, setTagPost] = useState<FeedPost | null>(null);
  const [addHole, setAddHole] = useState<number | null>(null);
  const [batch, setBatch] = useState<(BatchPhoto & Partial<OwnMediaSource>)[] | null>(null);
  const [firstPhoto, setFirstPhoto] = useState(false);
  const [retagPhoto, setRetagPhoto] = useState<HolePhoto | null>(null);
  const [fastPending, setFastPending] = useState(false);
  const [fastError, setFastError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const cache = useQueryClient();
  const uploader = useMediaUpload();

  const {
    posts,
    postsForFullscreen,
    mediaCounts,
    countsReady,
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
  // Untagged identity matches the tag store: raw canonical URL or stream-UID key.
  const isTaggedSource = (source: OwnMediaSource) => tagging.taggedUrls.has(source.url) || tagging.taggedUrls.has(holeMediaKey(source));
  const untaggedCount = tagging.ready ? (tagging.sources.data ?? []).filter(source => !isTaggedSource(source)).length : null;
  const ownOptions = (tagging.sources.data ?? []).filter(source => !isTaggedSource(source)).map(source => source.url);
  const sourcePost = (url: string): FeedPost => {
    const source = tagging.sources.data?.find(s => s.url === url);
    const found = posts.find(post => post.userId === user?.id && holeSourceUrl(post.mediaItems[0]) === url);
    if (found && !source) return found;
    return { id: url, userId: user?.id ?? '', actorType: 'personal', actorId: user?.id ?? '', username: '', displayName: '', avatarUrl: '', isVerified: false, creatorRelation: 'none', caption: '', mediaItems: [{ id: url, type: source?.mediaType ?? 'image', imageUrl: url, streamId: source?.streamId ?? undefined, thumbnailUrl: source?.posterUrl ?? undefined, duration: source?.durationSeconds ?? undefined, width: source?.width ?? 0, height: source?.height ?? 0 }], createdAt: source?.createdAt ?? '', likeCount: 0, commentCount: 0, shareCount: 0, review: null, isReview: false, isLikedByMe: false, isFollowedByMe: false };
  };
  const startTag = (post: FeedPost) => { setAddHole(null); tagging.submit.reset(); setTagPost(post); };
  const addFirst = (hole: number) => { tagging.submit.reset(); setFastError(null); setAddHole(hole); setTagPost(null); };
  const tagKnown = async (url: string) => {
    if (addHole == null) return;
    setFastPending(true); setFastError(null);
    try { await tagging.submit.mutateAsync({ post: sourcePost(url), hole: addHole }); setAddHole(null); }
    catch (error) { console.error('[hole-tag] failed', error); const video = tagging.sources.data?.find(s => s.url === url)?.mediaType === 'video'; setFastError(holePhotoErrorMessage(error, `The ${video ? 'video' : 'photo'} could not be tagged. The tag was not saved.`, video ? 'video' : 'image')); }
    finally { setFastPending(false); }
  };
  const tagLibrary = async (file: File, hole = addHole) => {
    if (hole == null || !knownHoles || !user || fastPending) return;
    const video = !file.type.startsWith('image/');
    if (video) {
      const validationError = libraryHoleVideoError(file);
      if (validationError) { setFastError(validationError); return; }
    }
    setFastPending(true); setFastError(null);
    setUploadProgress(video ? 0 : null);
    try {
      if (video) {
        // Mirror the review controller's completion adapter, not its control
        // promise: resilient upload resolves controls before bytes finish.
        const streamId = await new Promise<string>((resolve, reject) => {
          uploadVideoResilient({ file,
            onProgress: (loaded, total) => setUploadProgress(total > 0 ? Math.round((loaded / total) * 100) : 0),
            onSuccess: resolve, onError: reject,
          }).catch(reject);
        });
        await submitLibraryHoleVideo(file, streamId, courseId, user.id, hole, knownHoles);
        void pollStreamMetadata(streamId).then(() => cache.invalidateQueries({ queryKey: ['hole-photo-tags', courseId, user.id] })).catch(() => {});
      } else {
        const uploaded = await uploader.upload(file, { bucketType: 'clbhouz-course-images', destination: 'r2' });
        if (!uploaded.success || !uploaded.mediaUrl) throw new Error('Upload failed');
        await submitLibraryHolePhoto(file, uploaded.mediaUrl, courseId, user.id, hole, knownHoles);
      }
      setAddHole(null); setFirstPhoto(false);
      await cache.invalidateQueries({ queryKey: ['hole-photo-tags', courseId, user.id] });
      await cache.invalidateQueries({ queryKey: ['course-media-counts', courseId] });
      await cache.invalidateQueries({ queryKey: ['course-media-feed', courseId] });
    } catch (error) { console.error('[hole-tag] failed', error); setFastError(video ? 'The video could not be uploaded. Nothing was saved.' : holePhotoErrorMessage(error)); }
    finally { setFastPending(false); setUploadProgress(null); }
  };
  const beginBatch = async () => {
    if (!tagging.sources.isSuccess) return;
    setFastPending(true); setFastError(null);
    try {
      const photos = await Promise.all(tagging.sources.data.filter(photo => !isTaggedSource(photo)).map(async photo => ({ ...photo, exif: (await prepareHolePhoto(photo.url)).exif })));
      if (photos.length) setBatch(orderedBatch(photos));
    } catch { setFastError('The photos or videos could not be prepared for tagging. No tags were saved.'); }
    finally { setFastPending(false); }
  };
  const authors = new Map(posts.filter(post => post.actorType === 'personal' && post.displayName).map(post => [post.userId, post.displayName]));
  // Loaded zero is a fact; default/loading zero is not State B or C.
  const photoState = countsReady && analysis.isSuccess && analysis.data
    ? coursePhotoState(mediaCounts.total > 0 || (tagging.tags.data ?? []).some(row => row.status === 'approved'), analysis.data.available)
    : null;

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
      {photoState !== 'A' && photoState !== 'B' && photoState !== 'C' && <CourseMediaHeader
        mediaCounts={mediaCounts}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        courseId={courseId}
      />}
      {photoState === 'B' && analysis.data?.available && <CourseMediaNoPhotographs courseName={courseName} holes={analysis.data.holes} onHole={addFirst} onAddFirst={() => { setFastError(null); setFirstPhoto(true); }} />}
      {photoState === 'C' && <CourseMediaNothing courseName={courseName} onReview={() => navigate(`/courses/${courseId}/rate`)} />}
      {photoState !== 'B' && photoState !== 'C' && analysis.data?.available && tagging.tags.isSuccess && <HoleWalk available={analysis.data.available} holes={analysis.data.holes} rows={tagging.tags.data ?? []} totalMedia={mediaCounts.total} courseName={courseName} authors={authors} onAddFirst={addFirst} />}
      {tagging.ready && untaggedCount != null && untaggedCount > 0 && (
        <section className="px-5 pt-5">
          <p style={VERDICT_KICKER}>Everything else</p>
          {/* MEDIA_CTA_1: heading left, white pill right on one row. The pill
              sizes to its label and never shrinks; the heading wraps instead.
              The pill centres against the whole heading block, and its hit
              area is padded to 44px while the visible pill stays 13px/700. */}
          <div className="flex items-center gap-3">
            <h2 style={{ ...TAB_TITLE, flex: '1 1 auto', minWidth: 0 }}>{capitalPhotoCount(untaggedCount)} of yours {untaggedCount === 1 ? 'is' : 'are'} untagged</h2>
            <button
              type="button"
              disabled={fastPending || !tagging.sources.isSuccess}
              onClick={beginBatch}
              style={{
                flexShrink: 0, minHeight: 44, padding: '0 4px',
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              <span style={{
                background: A.INK, color: INK_ON_LIGHT, borderRadius: 999,
                fontSize: 13, fontWeight: 700, padding: '8px 16px',
                whiteSpace: 'nowrap',
              }}>Tag them</span>
            </button>
          </div>
          <p className="mt-2 text-[12.5px] leading-normal" style={{ color: A.MUTE }}>Tagging them to a hole takes one tap each.</p>
          {fastError && addHole == null && <p role="alert" className="text-sm">{fastError}</p>}
        </section>
      )}
      {photoState === 'A' && <CourseMediaNoHoleList courseName={courseName} photoCount={mediaCounts.photos}>
        <CourseMediaCanonGrid posts={posts} postsForFullscreen={postsForFullscreen} isLoading={isLoading} isError={isError} hasNextPage={hasNextPage ?? false} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage} refetch={refetch} courseName={courseName} courseId={courseId} noHolePreviewCount={mediaCounts.total} />
      </CourseMediaNoHoleList>}
      {photoState !== 'A' && photoState !== 'B' && photoState !== 'C' && <CourseMediaCanonGrid
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
        tagging={tagging.ready && user && knownHoles ? { memberId: user.id, holeCount: knownHoles.length, taggedUrls: tagging.taggedUrls, taggedHoles: new Map((tagging.tags.data ?? []).filter(row => row.status === 'approved' && row.user_id === user.id).map(row => [row.media_url, row.hole_no])), onTag: startTag } : undefined}
      />}
      <CourseMediaNotLive rows={tagging.tags.data ?? []} memberId={user.id} courseId={courseId} onRetag={knownHoles && knownHoles.length > 0 ? row => { tagging.retag.reset(); setRetagPhoto(row); } : undefined} />
      {retagPhoto && knownHoles && <CoursePhotoRetagPicker key={retagPhoto.id} row={retagPhoto} knownHoles={knownHoles} pending={tagging.retag.isPending} error={tagging.retag.error ? holePhotoErrorMessage(tagging.retag.error, `The ${retagPhoto.media_type === 'video' ? 'video' : 'photo'} could not be retagged. The new tag was not saved.`) : null} onClose={() => setRetagPhoto(null)} onSubmit={hole => tagging.retag.mutate({ row: retagPhoto, hole }, { onSuccess: () => setRetagPhoto(null) })} />}
      {addHole != null && <HoleKnownPhotoPath hole={addHole} photos={ownOptions} sources={tagging.sources.data} pending={fastPending} uploadProgress={uploadProgress} error={fastError} onChoose={tagKnown} onLibrary={tagLibrary} onClose={() => { setAddHole(null); }} />}
      {firstPhoto && knownHoles && <CourseFirstPhotoPicker knownHoles={knownHoles} pending={fastPending} uploadProgress={uploadProgress} error={fastError} onSubmit={tagLibrary} onClose={() => { setFirstPhoto(false); }} />}
      {batch && knownHoles && <HolePhotoBatchPath photos={batch} knownHoles={knownHoles} onClose={() => setBatch(null)} onTag={(url, hole) => tagging.submit.mutateAsync({ post: sourcePost(url), hole })} />}
      {tagPost && knownHoles && (
        <HolePhotoTagDialog key={addHole == null ? tagPost.mediaItems[0]?.id : `add-${addHole}`} imageUrl={holeSourceUrl(tagPost.mediaItems[0])} mediaSource={tagging.sources.data?.find(s => s.url === holeSourceUrl(tagPost.mediaItems[0]) || holeMediaKey(s) === holeMediaKey(tagPost.mediaItems[0]))} mediaSources={tagging.sources.data}
          initialHole={addHole} imageOptions={addHole == null ? undefined : ownOptions} onImageChange={url => setTagPost(sourcePost(url))}
          holeCount={knownHoles.length} knownHoleNumbers={knownHoles} usedHoles={(tagging.tags.data ?? []).filter(row => row.user_id === user.id).map(row => row.hole_no)}
          pending={tagging.submit.isPending}
          error={tagging.submit.error ? holePhotoErrorMessage(tagging.submit.error, `The ${tagPost.mediaItems[0]?.type === 'video' ? 'video' : 'photo'} could not be tagged. The tag was not saved.`, tagPost.mediaItems[0]?.type === 'video' ? 'video' : 'image') : null}
          onClose={() => setTagPost(null)}
          onSubmit={hole => tagging.submit.mutate({ post: tagPost, hole }, { onSuccess: () => setTagPost(null) })} />
      )}
      <ScrollToTopGlass />
    </div>
  );
};

export default CourseMediaTabNew;

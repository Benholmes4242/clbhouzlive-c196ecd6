import { VERDICT_KICKER, TAB_TITLE } from '@/components/courses/course-detail/about/AboutSection';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Tag, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCoursePlaceMedia, type PlaceMedia } from './hooks/useCoursePlaceMedia';
import { CoursePlaceTiles } from './CoursePlaceTiles';
import { placeShotsToFeedPosts } from '@/lib/courseMedia/memberShotPosts';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { supabase } from '@/integrations/supabase/client';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { PLACE_LABELS } from './ShotTagChoices';
import { fetchOwnMediaSources } from '@/lib/courseMedia/holePhotoData';
import { useQuery } from '@tanstack/react-query';
import type { CoursePlace } from '@/lib/courseMedia/places';
import './media-v2.css';
import { useCourseMedia, type CourseMediaFilter } from './hooks/useCourseMedia';
import { RailChips } from '@/components/ui/RailChips';
import './media-v3.css';
import { CourseMediaCanonGrid } from './CourseMediaCanonGrid';
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';

import { A } from '@/features/courses/components/holes/analytical/tokens';
import { INK_ON_LIGHT } from '@/lib/tokens/surfaces';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { useHolePhotoTagging } from './hooks/useHolePhotoTagging';
import { HolePhotoTagDialog } from './HolePhotoTagDialog';
import { AdminHoleTagging } from './AdminHoleTagging';
import { capitalPhotoCount, holeMediaKey, holeSourceUrl, type OwnMediaSource, type HolePhoto } from '@/lib/courseMedia/holePhotoData';
import { HoleWalk } from './HoleWalk';
import { courseWalkHoles } from '@/lib/courseMedia/holeWalk';
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
import { isHoleTagFromPost } from '@/lib/courseMedia/removeHoleTag';
import { memberTagConfirmation } from '@/lib/courseMedia/holeTagConfirmation';
import { toast } from 'sonner';
import { CourseFirstPhotoPicker, CoursePhotoRetagPicker, HoleTagRemoveDialog, CourseMediaNoPhotographs, CourseMediaNothing, CourseMediaNoHoleList, CourseMediaNotLive } from './CourseMediaEmptyStates';

interface CourseMediaTabNewProps {
  courseId: string;
  courseName?: string;
}

const CourseMediaTabNew: React.FC<CourseMediaTabNewProps> = ({ courseId, courseName }) => {
  const { t } = useTranslation(['courses']);
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<CourseMediaFilter>('all');
  // Same analysis source as About/You; empty available analysis falls back only in Media.
  const analysis = useCourseHoleAnalysis(user ? courseId : undefined);
  const walkHoles = courseWalkHoles(analysis.data);
  const knownHoles = walkHoles ? [...walkHoles.holes].sort((a, b) => a.hole_no - b.hole_no).map(hole => hole.hole_no) : null;
  const tagging = useHolePhotoTagging(courseId, user?.id, knownHoles);
  const places = useCoursePlaceMedia(courseId, user?.id);
  const placeOnlySources = useQuery({ queryKey: ['own-course-photo-sources', courseId, user?.id], enabled: !!user && analysis.isSuccess && !knownHoles, queryFn: () => user ? fetchOwnMediaSources(courseId, user.id) : Promise.resolve([]) });
  const sources = knownHoles ? tagging.sources : placeOnlySources;
  const tagsReady = tagging.ready || (!knownHoles && sources.isSuccess && places.tags.isSuccess);

  const [tagPost, setTagPost] = useState<FeedPost | null>(null);
  const [addHole, setAddHole] = useState<number | null>(null);
  const [batch, setBatch] = useState<(BatchPhoto & Partial<OwnMediaSource>)[] | null>(null);
  const [firstPhoto, setFirstPhoto] = useState(false);
  const [retagPhoto, setRetagPhoto] = useState<HolePhoto | null>(null);
  const [movePhoto, setMovePhoto] = useState<HolePhoto | null>(null);
  const [removePhoto, setRemovePhoto] = useState<HolePhoto | null>(null);
  const [walkFocus, setWalkFocus] = useState<{ hole: number; id: string; nonce: number } | null>(null);
  // Route focus is consumed once after both reads settle; HoleWalk owns shot fallback.
  const [searchParams] = useSearchParams();
  const deepLinkFocused = useRef(false);
  const linkedHole = searchParams.get('hole');
  const linkedShot = searchParams.get('shot');
  useEffect(() => {
    if (deepLinkFocused.current || !walkHoles || !tagging.tags.isSuccess || !knownHoles?.includes(Number(linkedHole))) return;
    deepLinkFocused.current = true;
    setWalkFocus({ hole: Number(linkedHole), id: linkedShot ?? '', nonce: Date.now() });
  }, [walkHoles, tagging.tags.isSuccess, knownHoles, linkedHole, linkedShot]);
  const kindOf = (row: HolePhoto) => row.media_type === 'video' ? 'video' : 'photo';
  const ordinalOf = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th'}`;
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

  useEffect(() => {
    if (countsReady && !(mediaCounts.photos > 0 && mediaCounts.videos > 0) && activeFilter !== 'all') handleFilterChange('all');
  }, [countsReady, mediaCounts.photos, mediaCounts.videos, activeFilter]);

  const gridRef = React.useRef<HTMLDivElement>(null);
  // Untagged identity matches the tag store: raw canonical URL or stream-UID key.
  const combinedTaggedUrls = new Set(tagging.taggedUrls);
  for (const row of places.tags.data ?? []) {
    if (row.user_id !== user?.id) continue;
    combinedTaggedUrls.add(row.media_url);
    combinedTaggedUrls.add(holeMediaKey({ url: row.media_url, mediaType: row.media_type, streamId: row.stream_id }));
  }
  const isTaggedSource = (source: OwnMediaSource) => combinedTaggedUrls.has(source.url) || combinedTaggedUrls.has(holeMediaKey(source));
  const untaggedCount = tagsReady && places.tags.isSuccess ? (sources.data ?? []).filter(source => !isTaggedSource(source)).length : null;
  const ownOptions = (sources.data ?? []).filter(source => !isTaggedSource(source)).map(source => source.url);
  const findSource = (url: string) => sources.data?.find(s => s.url === url);
  const tagPlace = async (url: string, place: CoursePlace) => {
    const source = findSource(url); if (!source) throw new Error('This shot is not yours at this course.');
    const row = await places.submit.mutateAsync({ source, place });
    void analyticsEvents.track('media_place_tag', { place, course_id: courseId }); return row;
  };
  const removePlace = async (row: PlaceMedia) => { await places.remove.mutateAsync({ row }); void analyticsEvents.track('media_place_untag', { place: row.place, course_id: courseId }); };
  const sourcePost = (url: string): FeedPost => {
    const source = sources.data?.find(s => s.url === url);
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
    catch (error) { console.error('[hole-tag] failed', error); const video = sources.data?.find(s => s.url === url)?.mediaType === 'video'; setFastError(holePhotoErrorMessage(error, `The ${video ? 'video' : 'photo'} could not be tagged. The tag was not saved.`, video ? 'video' : 'image')); }
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
    if (!sources.isSuccess) return;
    setFastPending(true); setFastError(null);
    try {
      const photos = await Promise.all(sources.data.filter(photo => !isTaggedSource(photo)).map(async photo => ({ ...photo, exif: (await prepareHolePhoto(photo.url)).exif })));
      if (photos.length) setBatch(orderedBatch(photos));
    } catch { setFastError('The photos or videos could not be prepared for tagging. No tags were saved.'); }
    finally { setFastPending(false); }
  };
  const authors = new Map(posts.filter(post => post.actorType === 'personal' && post.displayName).map(post => [post.userId, post.displayName]));
  // Loaded zero is a fact; default/loading zero is not State B or C.
  const photoState = countsReady && analysis.isSuccess && analysis.data
    ? coursePhotoState(mediaCounts.total > 0 || (tagging.tags.data ?? []).some(row => row.status === 'approved') || (places.tags.data ?? []).some(row => row.status === 'approved'), walkHoles != null)
    : null;
  // The member's own non-rejected tags, one entry per tag, so confirmations can
  // say "your second tag on the 9th" (BRIEF_HOLE_TAG_BATCH_V3).
  const ownHoleTags = user ? (tagging.tags.data ?? []).filter(row => row.user_id === user.id && row.status !== 'rejected').map(row => row.hole_no) : [];
  const hasTags = (tagging.tags.data ?? []).some(row => row.status === 'approved') || (places.tags.data ?? []).some(row => row.status === 'approved');
  const openPlace = async (place: CoursePlace, rows: PlaceMedia[]) => {
    void analyticsEvents.track('media_place_open', { place });
    const ready = rows.filter(row => row.media_type !== 'video' || row.duration_seconds != null);
    if (!ready.length) return;
    try {
      const ids = [...new Set(ready.map(row => row.user_id))];
      const profiles = await cache.fetchQuery({ queryKey: ['course-place-contributors', ids], queryFn: async () => {
        const { data, error } = await supabase.from('user_profiles').select('id, display_name, profile_photo_url').in('id', ids);
        if (error) throw error;
        return data ?? [];
      } });
      const members = new Map(profiles.map(profile => [profile.id, profile]));
      const mapped = ready.map(row => ({ ...row, member_id: row.user_id, member_name: members.get(row.user_id)?.display_name,
        member_avatar_url: members.get(row.user_id)?.profile_photo_url }));
      const posts = placeShotsToFeedPosts(mapped, courseName ?? '', courseId, place, t(`media.v2.places.${place}`, { defaultValue: PLACE_LABELS[place] }));
      if (!posts.length) return;
      openWithOrigin({ posts, index: 0, originEl: null, posterUrl: ready[0].media_type === 'video' ? ready[0].poster_url ?? '' : ready[0].media_url,
        mediaId: ready[0].id, openedFrom: 'course-media', options: { readOnly: true, syntheticPosts: true } });
    } catch { /* Refused identities never open an invented member caption. */ }
  };

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
      {countsReady && mediaCounts.total > 0 && photoState !== 'B' && photoState !== 'C' && <header className="media-v2-top">
        <span style={VERDICT_KICKER}>{t('media.v2.kicker', { defaultValue: "Through members' eyes" })}</span>
        <h2>{t(hasTags ? 'media.v2.sorted' : 'media.v2.unsorted', { total: mediaCounts.total, defaultValue: hasTags ? `${mediaCounts.total} shots, sorted by the golfers who took them` : `${mediaCounts.total} shots, none sorted yet` })}</h2>
        {hasTags && <p>{t('media.v2.sub', { defaultValue: "By hole and around the club. Tap any of them to walk it." })}</p>}
      </header>}
      {photoState === 'B' && walkHoles && <CourseMediaNoPhotographs courseName={courseName} holes={walkHoles.holes} onHole={addFirst} onAddFirst={() => { setFastError(null); setFirstPhoto(true); }} />}
      {photoState === 'C' && <CourseMediaNothing courseName={courseName} onReview={() => navigate(`/courses/${courseId}/rate`)} />}
      {photoState !== 'B' && photoState !== 'C' && walkHoles && tagging.tags.isSuccess && <HoleWalk available={true} holes={walkHoles.holes} scored={walkHoles.scored} rows={tagging.tags.data ?? []} totalMedia={mediaCounts.total} courseName={courseName} authors={authors} onAddFirst={addFirst} onChooseFirst={() => { setFastError(null); setFirstPhoto(true); }} memberId={user?.id} onMove={knownHoles && knownHoles.length > 0 ? row => { tagging.move.reset(); setMovePhoto(row); } : undefined} onRemove={knownHoles && knownHoles.length > 0 ? row => { tagging.remove.reset(); setRemovePhoto(row); } : undefined} focus={walkFocus} mediaPaused={!!(batch || tagPost || addHole != null || firstPhoto || retagPhoto || movePhoto || removePhoto)} />}
      {photoState !== 'B' && photoState !== 'C' && <CoursePlaceTiles rows={places.tags.data ?? []} onOpen={(place, rows) => { void openPlace(place, rows); }} />}
      {photoState !== 'A' && photoState !== 'B' && photoState !== 'C' && countsReady && mediaCounts.total > 0 && tagging.tags.isSuccess && places.tags.isSuccess && !hasTags && <section className="media-v2-unsorted">
        <div className="media-v2-unsorted-intro"><span className="media-v2-unsorted-icon"><Tag size={17} /></span><div><h3>{t('media.v2.unsortedTitle', { defaultValue: "Sort them by hole or by place" })}</h3><p>{t('media.v2.unsortedBody', { defaultValue: "Tag a shot to a hole, the clubhouse, the food, the practice ground or anything else, and this page builds itself." })}</p></div></div>
        <Button className="media-v2-primary" disabled={fastPending} onClick={() => untaggedCount ? void beginBatch() : setFirstPhoto(true)}>{untaggedCount ? t('media.v2.tagYour', { count: untaggedCount, defaultValue: untaggedCount === 1 ? "Tag your 1 shot" : `Tag your ${untaggedCount} shots` }) : t('media.v2.add', { defaultValue: "Add a photo or video" })}</Button>
      </section>}
      {countsReady && mediaCounts.total > 0 && photoState !== 'B' && photoState !== 'C' && <div className="media-v3-everything media-v2-head" data-media-everything><h3>{t(hasTags ? 'media.v2.everything' : 'media.v2.allShots', { defaultValue: hasTags ? 'Everything' : 'All shots' })}</h3><Button variant="ghost" className="media-v3-add" aria-label={t('media.v3.add', { defaultValue: 'Add a photo or video' })} onClick={() => navigate(`/courses/${courseId}/rate`)}><Plus size={17} strokeWidth={2.4} /></Button></div>}
      {countsReady && mediaCounts.photos > 0 && mediaCounts.videos > 0 && photoState !== 'B' && photoState !== 'C' && <div className="media-v3-filters"><RailChips ariaLabel={t('media.v3.filters', { defaultValue: 'Media filters' })} options={[
        { id: 'all', label: t('media.v3.all', { defaultValue: 'All' }), value: mediaCounts.total },
        { id: 'photos', label: t('media.v3.photos', { defaultValue: 'Photos' }), value: mediaCounts.photos },
        { id: 'videos', label: t('media.v3.videos', { defaultValue: 'Videos' }), value: mediaCounts.videos },
      ]} value={activeFilter} onChange={next => handleFilterChange(next as CourseMediaFilter)} /></div>}
      {tagsReady && untaggedCount != null && untaggedCount > 0 && (
        <section>
          <Button variant="ghost" className="media-v2-untagged" disabled={fastPending || !sources.isSuccess} onClick={beginBatch}>
            <Tag size={15} /><p><b>{t('media.v2.ownCount', { count: untaggedCount, defaultValue: `${untaggedCount} of yours` })}</b> {t('media.v2.untagged', { count: untaggedCount, defaultValue: untaggedCount === 1 ? "isn't tagged yet" : "aren't tagged yet" })}</p><span>{t('media.v2.tagThem', { defaultValue: "Tag them" })}</span><ChevronRight size={14} />
          </Button>
          {fastError && addHole == null && <p role="alert" className="text-sm">{fastError}</p>}
        </section>
      )}
      <AdminHoleTagging key={courseId} courseId={courseId} knownHoles={knownHoles} />
      {photoState !== 'B' && photoState !== 'C' && <div className="media-v3-grid"><CourseMediaCanonGrid
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
        tagging={tagsReady && user ? { memberId: user.id, holeCount: knownHoles?.length ?? 1, taggedUrls: combinedTaggedUrls, taggedHoles: new Map((tagging.tags.data ?? []).filter(row => row.status === 'approved' && row.user_id === user.id).map(row => [row.media_url, row.hole_no])), onTag: startTag } : undefined}
      /></div>}
      <CourseMediaNotLive rows={tagging.tags.data ?? []} memberId={user.id} courseId={courseId} onRetag={knownHoles && knownHoles.length > 0 ? row => { tagging.retag.reset(); setRetagPhoto(row); } : undefined} />
      {retagPhoto && knownHoles && <CoursePhotoRetagPicker key={retagPhoto.id} row={retagPhoto} knownHoles={knownHoles} pending={tagging.retag.isPending} error={tagging.retag.error ? holePhotoErrorMessage(tagging.retag.error, `The ${retagPhoto.media_type === 'video' ? 'video' : 'photo'} could not be retagged. The new tag was not saved.`) : null} onClose={() => setRetagPhoto(null)} onSubmit={hole => tagging.retag.mutate({ row: retagPhoto, hole }, { onSuccess: () => setRetagPhoto(null) })} />}
      {movePhoto && knownHoles && <CoursePhotoRetagPicker key={`move-${movePhoto.id}`} mode="move" row={movePhoto} knownHoles={knownHoles} pending={tagging.move.isPending} error={tagging.move.error ? holePhotoErrorMessage(tagging.move.error, `The ${kindOf(movePhoto)} could not be moved. It is still on the ${ordinalOf(movePhoto.hole_no)}.`) : null} onClose={() => setMovePhoto(null)} onSubmit={hole => tagging.move.mutate({ row: movePhoto, hole }, { onSuccess: () => { setMovePhoto(null); setWalkFocus({ hole, id: movePhoto.id, nonce: Date.now() }); } })} />}
      {removePhoto && <HoleTagRemoveDialog key={`remove-${removePhoto.id}`} row={removePhoto} fromPost={sources.isSuccess ? isHoleTagFromPost(removePhoto, sources.data ?? []) : sources.isError ? false : null} pending={tagging.remove.isPending} error={tagging.remove.error ? holePhotoErrorMessage(tagging.remove.error, `The ${kindOf(removePhoto)} could not be removed. It is still on the ${ordinalOf(removePhoto.hole_no)}.`) : null} onClose={() => setRemovePhoto(null)} onConfirm={() => tagging.remove.mutate({ row: removePhoto }, { onSuccess: () => setRemovePhoto(null) })} />}
      {addHole != null && <HoleKnownPhotoPath hole={addHole} photos={ownOptions} sources={sources.data} pending={fastPending} uploadProgress={uploadProgress} error={fastError} onChoose={tagKnown} onLibrary={tagLibrary} onClose={() => { setAddHole(null); }} />}
      {firstPhoto && knownHoles && <CourseFirstPhotoPicker hasShots={mediaCounts.total > 0} knownHoles={knownHoles} pending={fastPending} uploadProgress={uploadProgress} error={fastError} onSubmit={tagLibrary} onClose={() => { setFirstPhoto(false); }} />}
      {batch && <HolePhotoBatchPath photos={batch} knownHoles={knownHoles ?? []} existingPlaceTags={(places.tags.data ?? []).filter(row => row.user_id === user.id)} onTagPlace={tagPlace} onRemovePlace={removePlace} existingHoleTags={ownHoleTags} onClose={() => setBatch(null)} onTag={(url, hole) => tagging.submit.mutateAsync({ post: sourcePost(url), hole })} onRemove={row => tagging.remove.mutateAsync({ row })} />}
      {tagPost && (
        <HolePhotoTagDialog key={addHole == null ? tagPost.mediaItems[0]?.id : `add-${addHole}`} imageUrl={holeSourceUrl(tagPost.mediaItems[0])} mediaSource={sources.data?.find(s => s.url === holeSourceUrl(tagPost.mediaItems[0]) || holeMediaKey(s) === holeMediaKey(tagPost.mediaItems[0]))} mediaSources={sources.data}
          initialHole={addHole} imageOptions={addHole == null ? undefined : ownOptions} onImageChange={url => setTagPost(sourcePost(url))}
          holeCount={knownHoles?.length ?? 0} knownHoleNumbers={knownHoles ?? []}
          initialPlaceTag={(places.tags.data ?? []).find(row => row.user_id === user.id && holeMediaKey({ url: row.media_url, mediaType: row.media_type, streamId: row.stream_id }) === holeMediaKey(tagPost.mediaItems[0]))}
          onSubmitPlace={place => { void tagPlace(holeSourceUrl(tagPost.mediaItems[0]), place).then(() => { setTagPost(null); toast(t('media.v2.taggedPlace', { label: PLACE_LABELS[place], defaultValue: `Tagged to ${PLACE_LABELS[place]}.` })); }).catch(() => {}); }}
          onRemovePlace={row => { void removePlace(row).catch(() => {}); }}
          pending={tagging.submit.isPending || places.submit?.isPending || places.remove?.isPending}
          error={places.submit?.error || places.remove?.error ? holePhotoErrorMessage(places.submit?.error ?? places.remove?.error, 'The tag could not be saved. Nothing was changed.') : tagging.submit.error ? holePhotoErrorMessage(tagging.submit.error, `The ${tagPost.mediaItems[0]?.type === 'video' ? 'video' : 'photo'} could not be tagged. The tag was not saved.`, tagPost.mediaItems[0]?.type === 'video' ? 'video' : 'image') : null}
          onClose={() => setTagPost(null)}
          onSubmit={hole => tagging.submit.mutate({ post: tagPost, hole }, { onSuccess: () => { const count = ownHoleTags.filter(h => h === hole).length + 1; setTagPost(null); toast(memberTagConfirmation(hole, count)); } })} />
      )}
      <ScrollToTopGlass />
    </div>
  );
};

export default CourseMediaTabNew;

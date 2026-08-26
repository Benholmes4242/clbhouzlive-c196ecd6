// StageComposer - the shell of the P2 Stage composer.
//
// Modes:
//  - Create (default): fresh composer + create_post_v2 flow.
//  - Edit (editPostId): prefill from an existing post + owner-CRUD save.
//    Actor is display-only, schedule row shows only for status='scheduled'.
//  - Draft restore (draftId): fetch the draft row and hydrate the composer
//    the same way the in-composer Drafts sheet does.
//
// Owns: header, media stage + frame pills, media tray, caption field,
// detail rows, and orchestrates opening / closing every sheet.
// Delegates: state -> useStageComposer, submit -> usePostSubmit,
// drafts -> useDrafts, uploads -> postUploadController (module-level, survives unmount).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Pencil, X } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { useActiveActor } from '@/context/ActiveActorContext';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { setStatusBarStyleColor } from '@/hooks/useMedianStatusBar';
import { applyRouteChrome } from '@/lib/routeChrome';
import { usePostStudioStore } from '@/stores/usePostStudioStore';

import { useStageComposer, MAX_MEDIA, type StageMediaItem } from './hooks/useStageComposer';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { usePostSubmit, type SubmitResult } from './hooks/usePostSubmit';
import { useDrafts } from './hooks/useDrafts';
import { useEditablePost } from '@/hooks/useEditablePost';
import { startPostUpload } from './lib/postUploadController';

import MediaStageV2 from './components/MediaStageV2';
import FramePills from './components/FramePills';
import MediaTray from './components/MediaTray';
import SlideThumb from './components/SlideThumb';
import CaptionField from './components/CaptionField';
import CourseTagSheet from './components/CourseTagSheet';
import ActorSheet from './components/ActorSheet';
import ScheduleSheetV2 from './components/ScheduleSheetV2';
import DraftsSheetV2 from './components/DraftsSheetV2';
import ScheduledPostsSheetV2 from './components/ScheduledPostsSheetV2';

import CoverFrameSheet from './components/CoverFrameSheet';
import AdjustSheet from './components/AdjustSheet';
import PostSuccessV2 from './components/PostSuccessV2';
import BottomSheet from './components/BottomSheet';
import { CT_DARK } from '@/features/_shared/composerTokens';
import { LABEL, DISPLAY_TRACKING } from '@/lib/tokens/type';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import StageLoadingShell from './StageLoadingShell';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { CHIP_GLASS_CLASS } from '@/styles/photoScrim';

interface Props {
  onClose: () => void;
  onPosted?: () => void;
  /** Files already chosen by the nav picker before the composer opened. */
  initialMedia?: File[];
  /** True while the native picker is still up: page 1 shows its awaiting state. */
  awaitingMedia?: boolean;
  /** Edit mode: existing post id (owner-scoped). */
  editPostId?: string | null;
  /** Draft deep-link: hydrate the composer from this draft. */
  draftId?: string | null;
}

export default function StageComposer({ onClose, onPosted, initialMedia = [], awaitingMedia = false, editPostId, draftId }: Props) {
  const { profile } = useProfileData();
  const { t } = useTranslation('composer');

  const { activeActor, setActiveActor } = useActiveActor();
  const composer = useStageComposer();
  const { state, addFiles, removeAt, reorder, setActiveIndex, updateActive, setCaption, setCourse, setCourses, setScheduledAt, restoreDraft, hydrate, reset } = composer;
  const { submit, submitting } = usePostSubmit();
  const drafts = useDrafts(profile?.id);
  const queryClient = useQueryClient();

  const isEditMode = !!editPostId;

  // ---- Composer funnel instrumentation -----------------------------------
  // mode is derived from the props the openers set; entry from how it opened.
  const mode: 'create' | 'edit' | 'draft' = editPostId ? 'edit' : (draftId ? 'draft' : 'create');
  const mountedAtRef = useRef<number>(Date.now());
  const submittedRef = useRef(false);
  const captionStartedRef = useRef(false);
  // Read once at mount: a deep-linked open (edit / draft / share-a-round)
  // vs the create sheet.
  const entryRef = useRef<'create_sheet' | 'deep_link' | 'unknown'>('unknown');
  if (entryRef.current === 'unknown') {
    const st = usePostStudioStore.getState();
    if (editPostId || draftId || st.prefillCourse) entryRef.current = 'deep_link';
    else if (st.isOpen) entryRef.current = 'create_sheet';
  }

  // Abandon snapshot: refreshed on every render, read in the [] cleanup.
  // A state value read there would be the mount value, not the teardown one.
  const abandonRef = useRef({ hasMedia: false, hasCaption: false, mediaCount: 0 });

  useEffect(() => {
    // Analytics callsite: post_composer_opened
    analyticsEvents.track('post_composer_opened', { mode, entry: entryRef.current });
    return () => {
      if (submittedRef.current) return;
      // Analytics callsite: post_composer_abandoned
      analyticsEvents.track('post_composer_abandoned', {
        mode,
        has_media: abandonRef.current.hasMedia,
        has_caption: abandonRef.current.hasCaption,
        media_count: abandonRef.current.mediaCount,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Edit-mode load
  const editable = useEditablePost(editPostId ?? null);
  const [editStatus, setEditStatus] = useState<{ status: string | null; scheduledAt: string | null } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const stageAddInputRef = useRef<HTMLInputElement>(null);
  // Empty-state inputs. The LIBRARY input is rendered AT the button (not hidden
  // off in the header) because the iOS chooser menu anchors to the input's rect:
  // sitting it mid-stage keeps that menu off the footer. The CAMERA input carries
  // `capture`, which opens the camera directly with no OS source menu.
  const emptyCameraInputRef = useRef<HTMLInputElement>(null);
  const emptyLibraryInputRef = useRef<HTMLInputElement>(null);
  // Page-2 caption element: focus is chained off the Next tap because autoFocus
  // is unreliable in the WebView.
  const captionElRef = useRef<HTMLTextAreaElement | null>(null);

  // Fetch the post's status + scheduled_at (useEditablePost doesn't return them).
  useEffect(() => {
    if (!editPostId) return;
    let cancelled = false;
    supabase
      .from('posts')
      .select('status, scheduled_at')
      .eq('id', editPostId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const row = data as { status?: string | null; scheduled_at?: string | null } | null;
        setEditStatus({
          status: row?.status ?? null,
          scheduledAt: row?.scheduled_at ?? null,
        });
      });
    return () => { cancelled = true; };
  }, [editPostId]);


  useEffect(() => {
    return () => {
      try { applyRouteChrome(window.location.pathname, true); } catch { /* chrome re-resolve best-effort */ }
    };
  }, []);

  // Prefill state once the editable post lands.
  useEffect(() => {
    if (!isEditMode) return;
    if (hydrated) return;
    const data = editable.data;
    if (!data || !data.canManage) return;
    const media: StageMediaItem[] = data.media.map((m) => ({
      id: `existing-${m.id}`,
      existingId: m.id,
      type: m.mediaType,
      previewUrl: m.mediaUrl,
      frame: 'original',
      crop: null,
      trimStart: null,
      trimEnd: null,
      posterTimestamp: null,
    }));
    const allCourses = (data.courses ?? []).map((c) => ({
      id: c.courseId,
      name: c.courseName,
      country: c.country,
    }));
    hydrate({
      caption: data.caption,
      courses: allCourses,
      course: allCourses[0] ?? null,
      scheduledAt: editStatus?.status === 'scheduled' && editStatus.scheduledAt
        ? new Date(editStatus.scheduledAt)
        : null,
      media,
      activeIndex: 0,
    });

    setHydrated(true);
  }, [isEditMode, hydrated, editable.data, editStatus, hydrate]);

  // Draft deep-link hydration.
  useEffect(() => {
    if (isEditMode) return;
    if (!draftId || !profile?.id) return;
    let cancelled = false;
    supabase
      .from('post_drafts')
      .select('id, actor_type, actor_id, content, course_id, course_name, course_country, course_data')
      .eq('id', draftId)
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        // Multi-course drafts stash the full ordered list in course_data.courses.
        const cd = (data.course_data as { courses?: Array<{ id: string; name: string; country: string | null }> } | null) ?? null;
        const savedCourses = cd?.courses ?? [];
        const primary = data.course_id && data.course_name
          ? { id: data.course_id as string, name: data.course_name as string, country: (data.course_country as string) ?? null }
          : null;
        const courses = savedCourses.length > 0
          ? savedCourses
          : (primary ? [primary] : []);
        restoreDraft({
          caption: (data.content as string) ?? '',
          courses,
          course: courses[0] ?? null,
        });
        if (!cancelled) setRestoredDraftId(data.id as string);
      });
    return () => { cancelled = true; };
  }, [draftId, isEditMode, profile?.id, restoreDraft]);

  // C3 "Share this round" — open the composer pre-filled with the course and
  // the round the member tapped share on.
  const prefillCourse = usePostStudioStore((st) => st.prefillCourse);
  const prefillAppliedRef = useRef(false);

  useEffect(() => {
    if (isEditMode || draftId) return;
    if (prefillAppliedRef.current) return;
    if (!prefillCourse) return;
    prefillAppliedRef.current = true;
    hydrate({
      caption: '',
      courses: [prefillCourse],
      course: prefillCourse,
      scheduledAt: null,
      media: [],
      activeIndex: 0,
    });
  }, [isEditMode, draftId, prefillCourse, hydrate]);

  // Two-page wizard. Page 1 = media (dark), page 2 = words (light).
  // Tapping Post opens page 1 immediately in its AWAITING state while the OS
  // source menu floats above it. Files chosen -> page 1 comes alive; picker
  // CANCELLED -> the member stays on the page-1 EMPTY STATE and can pick again
  // or close. There is no route to page 2 without media on a fresh create.
  // Edit / draft / course-prefill entries land straight on page 2.

  const isFreshCreate = !editPostId && !draftId;
  const [page, setPage] = useState<1 | 2>(
    isFreshCreate && (initialMedia.length > 0 || awaitingMedia) ? 1 : 2,
  );

  // Both pages are dark canvases now (page 1 #0B0F14 stage, page 2 A.CANVAS
  // #15171F write surface), so the status bar keeps light icons and the notch
  // bleeds the page colour instead of the legacy light-mode white (FFF8FAFC).
  // On unmount, re-resolve chrome for the route underneath (Clubhouse dark,
  // Watch light, profile immersive, etc.) because overlay close is not a route change.
  useEffect(() => {
    try {
      if (page === 1) setStatusBarStyleColor('light', 'FF0B0F14');
      else setStatusBarStyleColor('light', 'FF15171F');
    } catch { /* status bar best-effort */ }
  }, [page]);

  // Files chosen by the bottom-nav picker are injected whenever the store's
  // initialMedia array changes. The nav opens the composer immediately (even on
  // picker cancel) and then re-opens it with files once the user chooses them.
  const lastInitialMediaRef = useRef<File[]>([]);
  useEffect(() => {
    if (isEditMode || draftId) return;
    const files = initialMedia ?? [];
    const prev = lastInitialMediaRef.current;
    const isNew = files.length !== prev.length || files.some((f, i) => f !== prev[i]);
    if (!isNew) return;
    lastInitialMediaRef.current = files;
    if (files.length > 0) {
      void addFiles(files);
      setPage(1);
    }
  }, [isEditMode, draftId, initialMedia, addFiles]);

  // Page 1 with no media renders the designed empty state, which owns the two
  // pick paths - camera and library - and NOTHING ELSE. A wizard post requires
  // media, so there is no words-only escape and no fallthrough to page 2 on
  // picker cancel: the member stays here until they choose files or close.

  const emptyStage = state.media.length === 0;


  const [sheet, setSheet] = useState<null | 'course' | 'actor' | 'schedule' | 'drafts' | 'scheduled' | 'cover' | 'adjust' | 'close-guard' | 'more'>(null);

  const [success, setSuccess] = useState<SubmitResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [restoredDraftId, setRestoredDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  const active = state.media[state.activeIndex] ?? null;

  // Refreshed every render so the unmount cleanup reads teardown values.
  abandonRef.current = {
    hasMedia: state.media.length > 0,
    hasCaption: state.caption.trim().length > 0,
    mediaCount: state.media.length,
  };

  // Media added: kind is image / video / mixed across the batch just added.
  const handleAddFiles = useCallback(async (files: File[]) => {
    const countBefore = state.media.length;
    await addFiles(files);
    if (files.length === 0) return;
    const hasVideo = files.some((f) => f.type.startsWith('video/'));
    const hasImage = files.some((f) => !f.type.startsWith('video/'));
    // Analytics callsite: post_media_added
    analyticsEvents.track('post_media_added', {
      mode,
      count_after: countBefore + files.length,
      kind: hasVideo && hasImage ? 'mixed' : (hasVideo ? 'video' : 'image'),
    });
  }, [addFiles, state.media.length, mode]);

  // Caption: post_caption_started fires ONCE per composer session.
  const handleSetCaption = useCallback((v: string) => {
    if (!captionStartedRef.current && v.trim().length > 0) {
      captionStartedRef.current = true;
      // Analytics callsite: post_caption_started
      analyticsEvents.track('post_caption_started', { mode });
    }
    setCaption(v);
  }, [setCaption, mode]);

  const openDetail = useCallback((row: 'course' | 'actor' | 'schedule') => {
    // Analytics callsite: post_detail_opened
    analyticsEvents.track('post_detail_opened', { mode, row });
  }, [mode]);




  // Post button vs Save button gating.

  // CREATE requires media: a wizard post must carry at least one photo or video.
  // The caption stays OPTIONAL (11% of posts have none).
  // EDIT is deliberately exempt - posts published before this rule, and round
  // posts, have no media and must still be saveable.
  const canSubmit = !submitting && !saving && (isEditMode || state.media.length > 0) && !!activeActor;


  // Edit-mode: schedule row visible only for still-scheduled posts.
  const showScheduleRow = !isEditMode || editStatus?.status === 'scheduled';

  const primaryLabel = isEditMode ? 'Save changes' : (state.scheduledAt ? 'Schedule' : 'Share');
  const primaryStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: '14px 20px',
    borderRadius: 999,
    border: 'none',
    /* CAPS ACTION: two points down, caps at 0.10em, padding unchanged. */
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.10em',
    background: canSubmit ? CT_DARK.amber : CT_DARK.dim,
    color: CT_DARK.ink,
    cursor: canSubmit ? 'pointer' : 'not-allowed',
  };


  const authorName = useMemo(() => activeActor?.name ?? profile?.display_name ?? 'You', [activeActor, profile]);
  const authorAvatar = activeActor?.avatarUrl ?? profile?.profile_photo_url ?? null;
  const authorUsername = activeActor?.slug ?? profile?.username ?? null;

  const doCreate = async () => {
    if (!canSubmit || !activeActor) return;
    try {
      const res = await submit({
        caption: state.caption,
        media: state.media,
        course: state.course,
        courses: state.courses,

        scheduledAt: state.scheduledAt,
        actorType: activeActor.type,
        actorId: activeActor.id,
        authorName,
        authorAvatarUrl: authorAvatar,
        authorUsername,
      });
      submittedRef.current = true;
      // Analytics callsite: post_submitted
      analyticsEvents.track('post_submitted', {
        mode,
        media_count: state.media.length,
        has_caption: state.caption.trim().length > 0,
        caption_len: state.caption.trim().length,
        course_tagged: !!state.course,
        courses_count: state.courses.length,
        scheduled: !!state.scheduledAt,
        actor_type: activeActor.type,
        total_ms: Math.round(Date.now() - mountedAtRef.current),
      });
      setSuccess(res);
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const doSaveEdit = useCallback(async () => {
    if (!editPostId || !editable.data) return;
    if (saving) return;
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {
        content: state.caption?.length ? state.caption : null,
        course_id: state.course?.id ?? null,
        tagged_course_ids: state.courses.map((c) => c.id),

      };
      // Only touch scheduled_at when the post is still scheduled.
      if (editStatus?.status === 'scheduled') {
        patch.scheduled_at = state.scheduledAt ? state.scheduledAt.toISOString() : null;
      }
      const { error: upErr } = await supabase.from('posts').update(patch as never).eq('id', editPostId);
      if (upErr) throw upErr;

      // Sync the single-course junction row to the primary course (best-effort;
      // full multi-course junction editing stays with useUpdatePost).
      const { error: pcDelErr } = await supabase.from('post_courses').delete().eq('post_id', editPostId);
      if (pcDelErr) throw pcDelErr;
      if (state.course?.id) {
        const { error: pcInsErr } = await supabase.from('post_courses').insert({
          post_id: editPostId,
          course_id: state.course.id,
          display_order: 0,
        } as never);
        if (pcInsErr) throw pcInsErr;
      }

      // Removed media rows: snapshot for cleanup, then delete.
      if (removedExistingIds.length > 0) {
        const { data: rows } = await supabase
          .from('post_media')
          .select('id, media_url, media_type, stream_id')
          .in('id', removedExistingIds);
        const snapshot = ((rows ?? []) as Array<{ id: string; media_url: string; media_type: string; stream_id: string | null }>).map((r) => ({
          id: r.id,
          media_url: r.media_url,
          media_type: (r.media_type === 'video' ? 'video' : 'image') as 'image' | 'video',
          stream_id: r.stream_id ?? null,
        }));
        const { error: delErr } = await supabase
          .from('post_media')
          .delete()
          .in('id', removedExistingIds);
        if (delErr) throw delErr;
        if (snapshot.length > 0) {
          supabase.functions
            .invoke('cleanup-review-media', { body: { mediaItems: snapshot } })
            .catch((err) => console.warn('[post-v2] media cleanup failed:', err));
        }
      }

      // Reorder kept existing media by their new position.
      const kept = state.media.filter((m) => m.existingId);
      for (let i = 0; i < kept.length; i++) {
        const m = kept[i];
        if (!m.existingId) continue;
        await supabase.from('post_media').update({ display_order: i } as never).eq('id', m.existingId);
      }

      // New media additions: hand to the controller against the existing post.
      const newMedia = state.media.filter((m) => !m.existingId && m.file);
      if (newMedia.length > 0) {
        startPostUpload(
          {
            jobId: crypto.randomUUID(),
            postId: editPostId,
            userId: editable.data.userId,
            actorType: editable.data.actorType,
            actorId: editable.data.actorId,
            isScheduled: editStatus?.status === 'scheduled',
            scheduledAt: state.scheduledAt?.toISOString(),
            skipFinalize: true,
            displayOrderOffset: kept.length,
          },
          newMedia,
        );
      }

      // Invalidate common caches.
      queryClient.invalidateQueries({ queryKey: ['editable-post', editPostId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', editPostId] });
      window.dispatchEvent(new CustomEvent('postUpdated', { detail: { postId: editPostId } }));

      submittedRef.current = true;
      // Analytics callsite: post_submitted
      analyticsEvents.track('post_submitted', {
        mode,
        media_count: state.media.length,
        has_caption: state.caption.trim().length > 0,
        caption_len: state.caption.trim().length,
        course_tagged: !!state.course,
        courses_count: state.courses.length,
        scheduled: !!state.scheduledAt,
        actor_type: activeActor?.type ?? editable.data.actorType,
        total_ms: Math.round(Date.now() - mountedAtRef.current),
      });
      setSaveSuccess(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }, [editPostId, editable.data, state, saving, editStatus, removedExistingIds, queryClient, activeActor, mode]);

  const onPrimary = () => {
    if (isEditMode) return void doSaveEdit();
    return void doCreate();
  };

  // Removal wrapper: track existing-id removals for the save phase.
  const handleRemoveAt = useCallback((idx: number) => {
    const item = state.media[idx];
    if (item?.existingId) {
      setRemovedExistingIds((ids) => (ids.includes(item.existingId!) ? ids : [...ids, item.existingId!]));
    }
    removeAt(idx);
  }, [state.media, removeAt]);

  const handleClose = () => {
    if (state.dirty) {
      setSheet('close-guard');
      return;
    }
    onClose();
  };

  const saveAsDraft = async () => {
    if (savingDraft) return;
    if (!activeActor) return;
    setSavingDraft(true);
    try {
      await drafts.save({
        actorType: activeActor.type,
        actorId: activeActor.id,
        content: state.caption || null,
        courseId: state.course?.id ?? null,
        courseName: state.course?.name ?? null,
        courseCountry: state.course?.country ?? null,
        courses: state.courses,
      });
      // Analytics callsite: post_draft_saved
      analyticsEvents.track('post_draft_saved', {
        mode,
        media_count: state.media.length,
        had_caption: state.caption.trim().length > 0,
      });
      if (restoredDraftId) {
        await drafts.remove(restoredDraftId);
        setRestoredDraftId(null);
      }
      setSheet(null);
      reset();
      onClose();
    } finally {
      setSavingDraft(false);
    }
  };

  // No hooks below this point - early returns above.

  if (saveSuccess) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: CT_DARK.bg, display: 'flex', flexDirection: 'column', zIndex: 12000 }}>
        <PostSuccessV2
          result={{ kind: 'published', postId: editPostId ?? '' }}
          onDone={() => { setSaveSuccess(false); onPosted?.(); onClose(); }}
        />
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: CT_DARK.bg, display: 'flex', flexDirection: 'column', zIndex: 12000 }}>
        <PostSuccessV2 result={success} onDone={() => { setSuccess(null); onPosted?.(); onClose(); }} />
      </div>
    );
  }

  const handleStageAdd = () => stageAddInputRef.current?.click();
  // autoFocus is unreliable in the WebView, so the Next tap chains focus onto
  // the caption itself - the tap is still the user activation the keyboard needs.
  const focusCaption = () => {
    if (isEditMode) return;
    requestAnimationFrame(() => { try { captionElRef.current?.focus(); } catch { /* focus best-effort */ } });
  };
  const handleStageAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) void handleAddFiles(files);
    e.target.value = '';
  };

  // Edit-mode load hold: never show the empty create composer while the
  // post is being fetched for editing. Shared with the /post-v2 route
  // fallback so the two silhouettes cannot drift.
  if (isEditMode && !hydrated && (editable.isLoading || (editable.data && editable.data.canManage))) {
    return <StageLoadingShell title="Edit post" onClose={onClose} />;
  }

  // Edit target failed to load or does not exist.
  // SETTLED IS NOT "NOT LOADING": useEditablePost is gated on postId + viewerId.
  if (isEditMode && editable.isFetched && !editable.data) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: CT_DARK.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 12000, padding: 24, gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: CT_DARK.ink }}>Couldn't load this post</div>
        <div style={{ fontSize: 13, color: CT_DARK.mute, textAlign: 'center' }}>It may have been deleted, or your connection dropped.</div>
        <button onClick={onClose} style={{ background: CT_DARK.elev, color: CT_DARK.ink, border: 0, borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
      </div>
    );
  }

  // Ownership guard: if edit target isn't manageable, close out.
  if (isEditMode && editable.data && !editable.data.canManage) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: CT_DARK.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 12000, padding: 24, gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: CT_DARK.ink }}>Can't edit this post</div>
        <div style={{ fontSize: 13, color: CT_DARK.mute, textAlign: 'center' }}>
          {editable.data.blockedReason === 'review-derived'
            ? 'Review posts are edited from the course page.'
            : "You don't have permission to edit this post."}
        </div>
        <button onClick={onClose} style={{ background: CT_DARK.elev, color: CT_DARK.ink, border: 0, borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
      </div>
    );
  }

  const sheets = (
    <>
        {/* Sheets */}
        <CourseTagSheet
          open={sheet === 'course'}
          onClose={() => setSheet(null)}
          onDone={setCourses}
          selected={state.courses}
          userId={profile?.id ?? null}
        />
        <ActorSheet open={sheet === 'actor'} onClose={() => setSheet(null)} onSelect={(a) => setActiveActor(a)} selectedId={activeActor?.id ?? null} />
  
        <ScheduleSheetV2
          open={sheet === 'schedule'}
          onClose={() => setSheet(null)}
          value={state.scheduledAt}
          onChange={setScheduledAt}
          onOpenScheduled={() => setSheet('scheduled')}
          scheduledCount={scheduledCount}
        />
        <DraftsSheetV2
          open={sheet === 'drafts'}
          onClose={() => setSheet(null)}
          drafts={drafts.drafts}
          onRestore={(d) => {
            const primary = d.course_id && d.course_name
              ? { id: d.course_id, name: d.course_name, country: d.course_country ?? null }
              : null;
            const cd = (d as unknown as { course_data?: { courses?: Array<{ id: string; name: string; country: string | null }> } }).course_data ?? null;
            const savedCourses = cd?.courses ?? [];
            const courses = savedCourses.length > 0 ? savedCourses : (primary ? [primary] : []);
            restoreDraft({ caption: d.content ?? '', course: courses[0] ?? null, courses });
            setRestoredDraftId(d.id);
          }}
          onDelete={drafts.remove}
        />
        <ScheduledPostsSheetV2
          open={sheet === 'scheduled'}
          onClose={() => setSheet(null)}
          userId={profile?.id}
          onCountChange={setScheduledCount}
        />
        <CoverFrameSheet
          open={sheet === 'cover'}
          onClose={() => setSheet(null)}
          item={active}
          onApply={(ts) => updateActive({ posterTimestamp: ts })}
        />
        <AdjustSheet
          open={sheet === 'adjust'}
          onClose={() => setSheet(null)}
          item={active}
          onApply={(crop) => updateActive({ crop })}
        />
  
        {/* More options sheet */}
        <BottomSheet open={sheet === 'more'} onClose={() => setSheet(null)} title="Options">
          <div style={{ padding: '4px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => setSheet('schedule')}
              style={moreRowStyle}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: CT_DARK.ink }}>Schedule post</span>
              {state.scheduledAt && <span style={{ fontSize: 12, color: CT_DARK.amber }}>Set</span>}
            </button>
            {!isEditMode && (
              <button
                onClick={() => setSheet('drafts')}
                style={moreRowStyle}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: CT_DARK.ink }}>Drafts</span>
                {drafts.drafts.length > 0 && <span style={{ fontSize: 12, color: CT_DARK.mute }}>{drafts.drafts.length}</span>}
              </button>
            )}
          </div>
        </BottomSheet>
  
        {/* Close guard */}
        <BottomSheet open={sheet === 'close-guard'} onClose={() => setSheet(null)} title="Unsaved changes">
          {/* One short job = content height. Grabber + title come from the sheet. */}
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: PAGE2.mute }}>
              Keep this post as a draft to finish later?
            </div>
            {!isEditMode && (
              <button
                onClick={saveAsDraft}
                disabled={savingDraft}
                style={{ height: 48, background: PAGE2.ink, color: PAGE2.canvas, border: 0, borderRadius: 999, fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', cursor: savingDraft ? 'not-allowed' : 'pointer', opacity: savingDraft ? 0.7 : 1 }}
              >
                {savingDraft ? 'Saving' : 'Save draft'}
              </button>
            )}
            <button
              onClick={() => { setSheet(null); reset(); onClose(); }}
              style={{ background: 'transparent', border: 0, padding: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', cursor: 'pointer', color: '#C0392B' }}
            >
              Discard
            </button>
          </div>
        </BottomSheet>
    </>
  );

  const frameRatio: Record<string, string> = { original: '4 / 5', '4:5': '4 / 5', '1:1': '1 / 1', '9:16': '9 / 16' };
  const stageAspect = active ? (frameRatio[active.frame] ?? '4 / 5') : '4 / 5';
  const firstItem = state.media[0] ?? null;

  // ---- PAGE 1 — MEDIA, DARK -------------------------------------------------
  if (page === 1) {
    return (
      <div style={{ position: 'fixed', inset: 0, height: '100dvh', background: CT_DARK.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 12000 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', paddingTop: 'max(env(safe-area-inset-top), 12px)', background: CT_DARK.bg, flex: 'none' }}>
          <button onClick={handleClose} aria-label="Close" style={closeButtonStyle}>
            {/* SVG GLYPH, NOT A TEXT GLYPH. A "\u00d7" character sits on the text
                baseline inside its line box, so flex centring centres the LINE
                BOX and the mark itself reads high and left of centre. The lucide
                icon is centred in its own square viewBox, so the button centres
                the mark. */}
            <X size={18} strokeWidth={2.2} />
          </button>
          {/* Fixed 22px = the 16/800 title's line box, so the bar height and
              position are identical with or without the title. */}
          <div style={{ minWidth: 0, flex: 1, height: 22, display: 'flex', alignItems: 'center' }}>

            {/* Title is CONDITIONAL on page 1: the empty state has no other
                context so it earns its place; with media present the
                photograph is the context and the title is not rendered.
                The bar keeps its height either way. */}
            {emptyStage && (
              <div style={{ fontSize: 16, fontWeight: 700, color: CT_DARK.ink, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isEditMode ? 'Edit post' : 'New post'}
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: CT_DARK.mute, fontVariantNumeric: 'tabular-nums' }}>1 / 2</div>
        </div>

        <input ref={stageAddInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleStageAddFiles} />

        {emptyStage ? (
          /* EMPTY STAGE — bottom-anchored and left-aligned, matching the
             uploading and success screens. Both inputs live HERE, each one
             anchored EXACTLY OVER ITS OWN BUTTON so the OS chooser opens from
             the control that was tapped. Scrolls rather than clipping when a
             long headline meets a short viewport. */
          <div
            style={{
              flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
              justifyContent: 'flex-end', padding: '0 28px 30px',
              background: CT_DARK.bg, overflowY: 'auto',
            }}
          >
            <div style={{ ...LABEL, color: CT_DARK.dim }}>
              {t('emptyState.limitKicker', { count: MAX_MEDIA })}
            </div>
            <div style={{ marginTop: 10, fontSize: 26, fontWeight: 700, letterSpacing: DISPLAY_TRACKING, lineHeight: 1.15, color: CT_DARK.ink }}>
              {isEditMode ? t('emptyState.promptEdit') : t('emptyState.prompt')}
            </div>
            <div
              style={{
                marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(248,250,252,0.10)',
                fontSize: 13, fontWeight: 600, lineHeight: 1.45, color: CT_DARK.mute,
              }}
            >
              {t('emptyState.nextStep')}
            </div>

            <div style={{ marginTop: 24, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => emptyLibraryInputRef.current?.click()}
                  style={emptyPrimaryButtonStyle}
                >
                  Choose from library
                </button>
                <input
                  ref={emptyLibraryInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleStageAddFiles}
                  tabIndex={-1}
                  aria-hidden="true"
                  style={anchoredInputStyle}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => emptyCameraInputRef.current?.click()}
                  style={emptySecondaryButtonStyle}
                >
                  Take photo or video
                </button>
                <input
                  ref={emptyCameraInputRef}
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  onChange={handleStageAddFiles}
                  tabIndex={-1}
                  aria-hidden="true"
                  style={anchoredInputStyle}
                />
              </div>
            </div>
          </div>

        ) : (
          <>
            {/* Media preview — aspect follows the frame pill, capped at 56vh */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: stageAspect, maxHeight: '56vh', flex: 'none', background: CT_DARK.surface, display: 'flex', overflow: 'hidden', transition: 'aspect-ratio 200ms ease' }}>
              <MediaStageV2
                item={active}
                index={state.activeIndex}
                total={1}
                onOpenAdjust={() => setSheet('adjust')}
                onOpenCover={() => setSheet('cover')}
                onRequestAdd={handleStageAdd}
              />

              {/* Slide counter — glass chip, top-right */}
              {state.media.length > 1 && (
                <div className={CHIP_GLASS_CLASS} style={{ position: 'absolute', right: 12, top: 12, padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: CT_DARK.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {state.activeIndex + 1}/{state.media.length}
                </div>
              )}

              {/* Edit chip — bottom-left glass pill */}
              {active && !active.existingId && (
                <button
                  onClick={() => setSheet(active.type === 'video' ? 'cover' : 'adjust')}
                  style={{ ...floatingChipStyle, top: 'auto', right: 'auto', bottom: 12, left: 12, padding: '9px 13px', fontWeight: 700, gap: 6 }}
                >
                  <Pencil size={13} />
                  Edit
                </button>
              )}
            </div>

            {/* Frame pills row (+ Add pill when there is exactly one slide) */}
            {active && !active.existingId && (
              <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px 0', background: CT_DARK.bg }}>
                <FramePills value={active.frame} onChange={(f) => updateActive({ frame: f })} />
                {state.media.length === 1 && (
                  <button
                    onClick={handleStageAdd}
                    style={{
                      marginLeft: 'auto',
                      background: 'transparent',
                      border: `1px dashed ${CT_DARK.dim}`,
                      color: CT_DARK.mute,
                      borderRadius: 999,
                      padding: '8px 13px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      flex: 'none',
                    }}
                  >+ Add</button>
                )}
              </div>
            )}

            {/* Filmstrip — only when there is more than one slide, centred in the gap */}
            {state.media.length > 1 ? (
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 16px', background: CT_DARK.bg }}>
                <MediaTray
                  media={state.media}
                  activeIndex={state.activeIndex}
                  onSelect={setActiveIndex}
                  onRemove={handleRemoveAt}
                  onReorder={reorder}
                  onAddFiles={handleAddFiles}
                />
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, background: CT_DARK.bg }} />
            )}
          </>
        )}

        {/* Next */}
        <div style={{ flex: 'none', background: CT_DARK.bg, padding: '10px 16px max(env(safe-area-inset-bottom), 14px)' }}>
          <button
            onClick={() => { setPage(2); focusCaption(); }}
            disabled={emptyStage}
            style={{
              width: '100%',
              padding: '15px 20px',
              borderRadius: 999,
              border: 'none',
              /* CAPS ACTION. */
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.10em',
              background: emptyStage ? 'rgba(248,250,252,0.10)' : CT_DARK.ink,
              color: emptyStage ? CT_DARK.dim : '#11131A',
              cursor: emptyStage ? 'default' : 'pointer',
            }}
          >
            Next
          </button>
        </div>


        {sheets}
      </div>
    );
  }

  // ---- PAGE 2 — WORDS, DARK ----------------------------------------------
  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', background: PAGE2.canvas, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 12000 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', paddingTop: 'max(env(safe-area-inset-top), 12px)', background: PAGE2.canvas, flex: 'none' }}>
        <button
          onClick={() => (state.media.length > 0 ? setPage(1) : handleClose())}
          aria-label={state.media.length > 0 ? 'Back' : 'Close'}
          style={page2IconButtonStyle}
        >
          {/* SVG GLYPHS, NOT TEXT GLYPHS - same reason as page 1's close. The
              "\u2039" was the worse of the two: it carries asymmetric side
              bearing, so it read both high and right inside the circle. */}
          {state.media.length > 0
            ? <ChevronLeft size={18} strokeWidth={2.2} />
            : <X size={18} strokeWidth={2.2} />}
        </button>
        <div style={{ minWidth: 0, flex: 1 }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: PAGE2.mute, fontVariantNumeric: 'tabular-nums' }}>2 / 2</div>
      </div>

      <input ref={stageAddInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleStageAddFiles} />

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2px 0 16px', display: 'flex', flexDirection: 'column' }}>
        {/* Media strip — every slide, tap one to go back and edit it */}
        {state.media.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 6, padding: '2px 16px 0', overflowX: 'auto' }}>
              {state.media.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => { setActiveIndex(i); setPage(1); }}
                  aria-label={`Edit item ${i + 1}`}
                  style={{ position: 'relative', width: 56, height: 70, borderRadius: 10, overflow: 'hidden', flex: 'none', border: `1px solid ${PAGE2.line}`, padding: 0, background: PAGE2.panel, cursor: 'pointer' }}
                >
                  <SlideThumb item={m} glyph={20} />
                </button>
              ))}
              <button
                onClick={handleStageAdd}
                aria-label="Add photos or video"
                style={{ width: 56, height: 70, borderRadius: 10, flex: 'none', border: `1px dashed ${PAGE2.dim}`, background: 'transparent', color: PAGE2.mute, fontSize: 18, cursor: 'pointer' }}
              >+</button>
            </div>
            <div style={{ padding: '6px 18px 0', fontSize: 11, color: PAGE2.dim }}>Tap a photo to go back and edit</div>
          </>
        )}

        {/* Caption — bare on the canvas, cursor flashing on arrival */}
        <div style={{ padding: '10px 16px 0' }}>
          <CaptionField
            value={state.caption}
            onChange={handleSetCaption}
            currentUserId={profile?.id ?? null}
            variant="dark"
            minHeight={96}
            placeholder="What's on your mind"
            autoFocus={!isEditMode}
            inputRef={(el) => { captionElRef.current = el; }}
          />
          <div style={{ fontSize: 11, color: PAGE2.dim, marginTop: 2 }}>@mention friends and businesses</div>
        </div>

        {/* Tag a course — suggestion-first, Search is the fallback */}
        <div style={{ background: PAGE2.panel, border: `1px solid ${PAGE2.line}`, borderRadius: 16, margin: '18px 16px 0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: PAGE2.ink }}>Tag a course</span>
              <button
                onClick={() => { openDetail('course'); setSheet('course'); }}
                style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, border: 0, background: 'transparent', color: PAGE2.ink, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Search
                <ChevronRight size={12} strokeWidth={2.5} />
              </button>
            </div>

            {/* Tagging is SEARCH-ONLY (MICRO_BRIEF_POST_WIZARD_FIELDS §4): the
                recent-rounds suggestion chips are gone. Only a course the
                member actually chose renders here, and it stays removable. */}
            {state.courses.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {state.courses.map((c) => (
                  <button
                    key={`tagged-${c.id}`}
                    onClick={() => setCourses(state.courses.filter((x) => x.id !== c.id))}
                    aria-label={`Untag ${c.name}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${PAGE2.ink}`, background: PAGE2.ink, borderRadius: 999, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: PAGE2.canvas }}
                  >
                    {c.name}
                    <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.85 }}>×</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail rows — Drafts appears only when drafts exist */}
        <div style={{ background: PAGE2.panel, border: `1px solid ${PAGE2.line}`, borderRadius: 16, margin: '12px 16px 0', overflow: 'hidden' }}>
          <button onClick={() => { openDetail('actor'); setSheet('actor'); }} style={page2RowStyle(false)}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: PAGE2.ink }}>Posting as</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: PAGE2.mute, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authorName}</span>
              <SquircleAvatar src={authorAvatar} alt={authorName} size={26} fallback={authorUsername?.[0]} hairlineRing ringColor={DARK_HAIRLINE} />
            </span>
            <ChevronRight size={14} color={PAGE2.dim} style={{ marginLeft: 6, flex: 'none' }} />
          </button>
          {showScheduleRow && (
            <button onClick={() => { openDetail('schedule'); setSheet('schedule'); }} style={page2RowStyle(true)}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: PAGE2.ink }}>Schedule for later</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, color: state.scheduledAt ? PAGE2.ink : PAGE2.mute }}>
                {state.scheduledAt ? state.scheduledAt.toLocaleString() : 'Off'}
              </span>
              <ChevronRight size={14} color={PAGE2.dim} style={{ marginLeft: 6, flex: 'none' }} />
            </button>
          )}
          {!isEditMode && drafts.drafts.length > 0 && (
            <button onClick={() => setSheet('drafts')} style={page2RowStyle(true)}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: PAGE2.ink }}>Drafts</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, color: PAGE2.mute, fontVariantNumeric: 'tabular-nums' }}>{drafts.drafts.length}</span>
              <ChevronRight size={14} color={PAGE2.dim} style={{ marginLeft: 6, flex: 'none' }} />
            </button>
          )}
        </div>
      </div>


      {/* Share */}
      <div style={{ flex: 'none', background: PAGE2.canvas, padding: '10px 16px max(env(safe-area-inset-bottom), 14px)' }}>
        <button
          onClick={onPrimary}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: 999,
            border: 'none',
            /* CAPS ACTION. */
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.10em',
            background: canSubmit ? PAGE2.ink : 'rgba(248,250,252,0.10)',
            color: canSubmit ? PAGE2.canvas : PAGE2.dim,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {(submitting || saving)
            ? <Loader2 size={16} className="animate-spin" style={{ display: 'block', margin: '0 auto' }} />
            : primaryLabel}
        </button>
      </div>

      {sheets}
    </div>
  );
}


// Empty-stage buttons: 44px, fully rounded.
const emptyButtonBase: React.CSSProperties = {
  width: '100%',
  height: 44,
  borderRadius: 999,
  /* CAPS ACTION. */
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.10em',
  cursor: 'pointer',
};

const emptyPrimaryButtonStyle: React.CSSProperties = {
  ...emptyButtonBase,
  border: 0,
  background: CT_DARK.ink,
  color: '#11131A',
};

const emptySecondaryButtonStyle: React.CSSProperties = {
  ...emptyButtonBase,
  border: `1px solid ${CT_DARK.line}`,
  background: 'rgba(248,250,252,0.06)',
  color: CT_DARK.ink,
};

// The input sits exactly over its button so the iOS chooser menu anchors there.
const anchoredInputStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  opacity: 0,
  pointerEvents: 'none',
};

const closeButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  background: 'rgba(248,250,252,0.08)',
  border: 0,
  color: '#F8FAFC',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 21,
  lineHeight: 1,
  padding: 0,
};

const iconButtonStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  background: 'rgba(248,250,252,0.08)',
  border: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flex: 'none',
};

const floatingChipStyle: React.CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  background: 'rgba(15, 18, 24, 0.72)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: '#F8FAFC',
  border: '1px solid rgba(248,250,252,0.10)',
  borderRadius: 999,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const moreRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(248,250,252,0.06)',
  border: '1px solid rgba(248,250,252,0.08)',
  borderRadius: 14,
  cursor: 'pointer',
  textAlign: 'left',
};

// Page 2 (words) DARK tokens. Values are lifted from the already-converted
// profile bottom sheet (src/features/profile-sheet-v2), which takes them from
// the analytical ramp — so the composer matches an existing dark surface
// rather than inventing a second dark.
//   canvas A.CANVAS #15171F   panel A.PANEL #1B1E27
//   line   A.BORDER           ink/mute/dim A.INK / A.MUTE / A.DIM
// Named PAGE2 (not LIGHT): an object called LIGHT holding dark values is the
// naming fault that produced DARK_BAND_GREEN beside BAND_GREEN_DARK.
const PAGE2 = {
  canvas: A.CANVAS,
  panel: A.PANEL,
  line: A.BORDER,
  ink: A.INK,
  mute: A.MUTE,
  dim: A.DIM,
} as const;

const page2IconButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: `1px solid ${PAGE2.line}`,
  background: PAGE2.panel,
  color: PAGE2.ink,
  fontSize: 20,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flex: 'none',
};

const page2RowStyle = (divider: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  width: '100%',
  padding: '14px 14px',
  background: 'transparent',
  border: 0,
  borderTop: divider ? `1px solid ${PAGE2.line}` : 0,
  cursor: 'pointer',
  textAlign: 'left',
});

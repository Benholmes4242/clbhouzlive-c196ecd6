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
import { Loader2, MoreHorizontal } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { useActiveActor } from '@/context/ActiveActorContext';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { setStatusBarStyleColor } from '@/hooks/useMedianStatusBar';
import { applyRouteChrome } from '@/lib/routeChrome';
import { usePostStudioStore } from '@/stores/usePostStudioStore';

import { useStageComposer, type StageMediaItem } from './hooks/useStageComposer';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { usePostSubmit, type SubmitResult } from './hooks/usePostSubmit';
import { useDrafts } from './hooks/useDrafts';
import { useEditablePost } from '@/hooks/useEditablePost';
import { startPostUpload } from './lib/postUploadController';

import MediaStageV2 from './components/MediaStageV2';
import FramePills from './components/FramePills';
import MediaTray from './components/MediaTray';
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
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';

interface Props {
  onClose: () => void;
  onPosted?: () => void;
  /** Files already chosen by the nav picker before the composer opened. */
  initialMedia?: File[];
  /** Edit mode: existing post id (owner-scoped). */
  editPostId?: string | null;
  /** Draft deep-link: hydrate the composer from this draft. */
  draftId?: string | null;
}

export default function StageComposer({ onClose, onPosted, initialMedia = [], editPostId, draftId }: Props) {
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


  // Composer is a light canvas surface -> dark status-bar icons.
  // On unmount, re-resolve chrome for the route underneath (Clubhouse dark,
  // Watch light, profile immersive, etc.) because overlay close is not a route change.
  useEffect(() => {
    try { setStatusBarStyleColor('dark', 'FFF8FAFC'); } catch { /* status bar best-effort */ }
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
  // Edit / draft / course-prefill entries and a cancelled picker land on
  // page 2; media chosen through the picker jumps to page 1.
  const [page, setPage] = useState<1 | 2>(initialMedia.length > 0 && !editPostId && !draftId ? 1 : 2);

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
  const canSubmit = !submitting && !saving && (state.caption.trim().length > 0 || state.media.length > 0) && !!activeActor;

  // Edit-mode: schedule row visible only for still-scheduled posts.
  const showScheduleRow = !isEditMode || editStatus?.status === 'scheduled';

  const primaryLabel = isEditMode ? 'Save changes' : (state.scheduledAt ? 'Schedule' : 'Share');
  const primaryStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: '14px 20px',
    borderRadius: 999,
    border: 'none',
    fontSize: 15,
    fontWeight: 700,
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
  const handleStageAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) void handleAddFiles(files);
    e.target.value = '';
  };

  // Edit-mode load hold: never show the empty create composer while the
  // post is being fetched for editing.
  if (isEditMode && !hydrated && (editable.isLoading || (editable.data && editable.data.canManage))) {
    return (
      <div style={{ position: 'fixed', inset: 0, height: '100dvh', background: CT_DARK.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 12000 }}>
        {/* Header mirror */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 13px', paddingTop: 'max(env(safe-area-inset-top), 16px)', background: CT_DARK.bg, borderBottom: `1px solid ${CT_DARK.line}`, flex: 'none' }}>
          <button onClick={onClose} aria-label="Close" style={closeButtonStyle}>
            {'\u2039'}
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: CT_DARK.ink, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Edit post</div>
          </div>
        </div>
        {/* Stage block */}
        <div style={{ flex: '1 1 0', minHeight: 0, padding: 12 }}>
          <div className="clb-shimmer-dark" style={{ width: '100%', height: '100%', borderRadius: 16, background: 'rgba(255,255,255,0.06)' }} />
        </div>
        {/* Tray thumbs + caption bars */}
        <div style={{ flex: 'none', padding: '8px 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="clb-shimmer-dark" style={{ width: 46, height: 46, borderRadius: 10, background: 'rgba(255,255,255,0.06)' }} />
            <div className="clb-shimmer-dark" style={{ width: 46, height: 46, borderRadius: 10, background: 'rgba(255,255,255,0.06)' }} />
            <div className="clb-shimmer-dark" style={{ width: 46, height: 46, borderRadius: 10, background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="clb-shimmer-dark" style={{ height: 14, width: '80%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
          <div className="clb-shimmer-dark" style={{ height: 14, width: '55%', borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    );
  }

  // Edit target failed to load or does not exist.
  if (isEditMode && !editable.isLoading && !editable.data) {
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

  const courseLabel = state.course?.name ?? 'Add course';

  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', background: CT_DARK.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 12000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', paddingTop: 'max(env(safe-area-inset-top), 12px)', background: CT_DARK.bg, flex: 'none' }}>
        <button onClick={handleClose} aria-label="Close" style={closeButtonStyle}>
          {'\u2039'}
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: CT_DARK.ink, letterSpacing: '-0.015em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {isEditMode ? 'Edit post' : 'New post'}
          </div>
        </div>
        <button
          onClick={() => { openDetail('actor'); setSheet('actor'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 0, cursor: 'pointer', padding: 0, minWidth: 0 }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: CT_DARK.mute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
            {authorName}
          </span>
          <SquircleAvatar
            src={authorAvatar}
            alt={authorName}
            size={32}
            fallback={authorUsername?.[0]}
            hairlineRing
          />
        </button>
      </div>

      <input ref={stageAddInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleStageAddFiles} />

      {/* Stage — fixed 4:5 aspect, full width */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', flex: 'none', background: CT_DARK.surface, display: 'flex', overflow: 'hidden' }}>
        <MediaStageV2
          item={active}
          index={state.activeIndex}
          total={state.media.length}
          onOpenAdjust={() => setSheet('adjust')}
          onOpenCover={() => setSheet('cover')}
          onRequestAdd={handleStageAdd}
        />

        {/* Edit chip */}
        {active && !active.existingId && (
          <button
            onClick={() => setSheet(active.type === 'video' ? 'cover' : 'adjust')}
            style={floatingChipStyle}
          >
            Edit
          </button>
        )}

        {/* Course chip */}
        <button
          onClick={() => { openDetail('course'); setSheet('course'); }}
          style={{ ...floatingChipStyle, top: 'auto', right: 'auto', bottom: 12, left: 12, maxWidth: 'calc(100% - 24px)' }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseLabel}</span>
        </button>
      </div>

      {/* Frame pills — between stage and filmstrip */}
      {active && !active.existingId && (
        <div style={{ flex: 'none', display: 'flex', justifyContent: 'center', padding: '10px 0', background: CT_DARK.bg }}>
          <FramePills value={active.frame} onChange={(f) => updateActive({ frame: f })} />
        </div>
      )}

      {/* Filmstrip */}
      <div style={{ flex: 'none', padding: '10px 12px', background: CT_DARK.bg }}>
        <MediaTray
          media={state.media}
          activeIndex={state.activeIndex}
          onSelect={setActiveIndex}
          onRemove={handleRemoveAt}
          onReorder={reorder}
          onAddFiles={handleAddFiles}
        />
      </div>

      {/* Caption */}
      <div style={{ flex: 1, minHeight: 0, padding: '0 16px', background: CT_DARK.bg, overflowY: 'auto' }}>
        <CaptionField value={state.caption} onChange={handleSetCaption} currentUserId={profile?.id ?? null} />
      </div>

      {/* Action bar */}
      <div style={{ flex: 'none', background: CT_DARK.bg, padding: '10px 16px max(env(safe-area-inset-bottom), 14px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => { openDetail('actor'); setSheet('actor'); }}
            aria-label="Switch account"
            style={{ ...iconButtonStyle, padding: 2 }}
          >
            <SquircleAvatar
              src={authorAvatar}
              alt={authorName}
              size={32}
              fallback={authorUsername?.[0]}
              hairlineRing
            />
          </button>
          <button
            type="button"
            onClick={() => setSheet('more')}
            aria-label="More options"
            style={iconButtonStyle}
          >
            <MoreHorizontal size={20} color={CT_DARK.ink} />
          </button>
          <button onClick={onPrimary} disabled={!canSubmit} style={primaryStyle}>
            {(submitting || saving)
              ? <Loader2 size={16} className="animate-spin" style={{ display: 'block', margin: '0 auto' }} />
              : primaryLabel}
          </button>
        </div>
      </div>

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
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isEditMode && (
            <>
              {state.media.length > 0 && (
                <div style={{ fontSize: 12, fontWeight: 500, color: CT_DARK.mute, marginBottom: 8, textAlign: 'center' }}>
                  {t('closeGuard.mediaNotSaved', { count: state.media.length })}
                </div>
              )}
              <button onClick={saveAsDraft} disabled={savingDraft} style={{ background: CT_DARK.elev, color: CT_DARK.ink, border: 0, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: savingDraft ? 'not-allowed' : 'pointer', opacity: savingDraft ? 0.7 : 1 }}>{savingDraft ? 'Saving' : 'Save draft'}</button>
            </>
          )}
          <button onClick={() => { setSheet(null); reset(); onClose(); }} style={{ background: 'transparent', border: `1px solid ${CT_DARK.line}`, borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', color: CT_DARK.danger }}>Discard</button>
        </div>
      </BottomSheet>
    </div>
  );
}

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

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
import { X, Loader2 } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { useActiveActor } from '@/context/ActiveActorContext';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { setStatusBarStyleColor } from '@/hooks/useMedianStatusBar';
import { applyRouteChrome } from '@/lib/routeChrome';
import { usePostStudioStore } from '@/stores/usePostStudioStore';

import { useStageComposer, type StageMediaItem, type AttachedRound } from './hooks/useStageComposer';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useMyRoundsAtCourse, pickPreselectedRound, daysSinceRound } from '@/hooks/feed/useMyRoundsAtCourse';
import AttachRoundSheet, { formatRoundLabel } from './components/AttachRoundSheet';

import { usePostSubmit, type SubmitResult } from './hooks/usePostSubmit';
import { useDrafts } from './hooks/useDrafts';
import { useEditablePost } from '@/hooks/useEditablePost';
import { startPostUpload } from './lib/postUploadController';

import MediaStageV2 from './components/MediaStageV2';
import FramePills from './components/FramePills';
import MediaTray from './components/MediaTray';
import CaptionField from './components/CaptionField';
import DetailRows from './components/DetailRows';
import CourseTagSheet from './components/CourseTagSheet';
import ActorSheet from './components/ActorSheet';
import ScheduleSheetV2 from './components/ScheduleSheetV2';
import DraftsSheetV2 from './components/DraftsSheetV2';
import ScheduledPostsSheetV2 from './components/ScheduledPostsSheetV2';

import CoverFrameSheet from './components/CoverFrameSheet';
import AdjustSheet from './components/AdjustSheet';
import PostSuccessV2 from './components/PostSuccessV2';
import BottomSheet from './components/BottomSheet';

interface Props {
  onClose: () => void;
  onPosted?: () => void;
  /** Edit mode: existing post id (owner-scoped). */
  editPostId?: string | null;
  /** Draft deep-link: hydrate the composer from this draft. */
  draftId?: string | null;
}

export default function StageComposer({ onClose, onPosted, editPostId, draftId }: Props) {
  const { profile } = useProfileData();
  const { t } = useTranslation('composer');

  const { activeActor, setActiveActor } = useActiveActor();
  const composer = useStageComposer();
  const { state, addFiles, removeAt, reorder, setActiveIndex, updateActive, setCaption, setCourse, setCourses, setAttachedRound, setScheduledAt, restoreDraft, hydrate, reset } = composer;
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
  const [editStatus, setEditStatus] = useState<{ status: string | null; scheduledAt: string | null; whsScoreId: string | null } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const stageAddInputRef = useRef<HTMLInputElement>(null);

  // Fetch the post's status + scheduled_at + attached round
  // (useEditablePost doesn't return them).
  useEffect(() => {
    if (!editPostId) return;
    let cancelled = false;
    supabase
      .from('posts')
      .select('status, scheduled_at, whs_score_id')
      .eq('id', editPostId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const row = data as { status?: string | null; scheduled_at?: string | null; whs_score_id?: string | null } | null;
        setEditStatus({
          status: row?.status ?? null,
          scheduledAt: row?.scheduled_at ?? null,
          whsScoreId: row?.whs_score_id ?? null,
        });
      });
    return () => { cancelled = true; };
  }, [editPostId]);


  // Composer is a light #F8FAFC surface -> dark status-bar icons.
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
      // C2 edit path: restore the attached round so an edit never drops it.
      // Detail (score/tee) is filled in once the round list resolves.
      attachedRound: editStatus?.whsScoreId
        ? { whsScoreId: editStatus.whsScoreId, playDate: '', grossScore: null, coursePar: null, teeMarker: null }
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
  const prefillWhsScoreId = usePostStudioStore((st) => st.prefillWhsScoreId);
  const prefillAppliedRef = useRef(false);
  const skipNextCourseClearRef = useRef(false);

  useEffect(() => {
    if (isEditMode || draftId) return;
    if (prefillAppliedRef.current) return;
    if (!prefillCourse) return;
    prefillAppliedRef.current = true;
    // The course-change guard must not strip the round we just attached.
    skipNextCourseClearRef.current = true;
    hydrate({
      caption: '',
      courses: [prefillCourse],
      course: prefillCourse,
      scheduledAt: null,
      attachedRound: prefillWhsScoreId
        ? { whsScoreId: prefillWhsScoreId, playDate: '', grossScore: null, coursePar: null, teeMarker: null }
        : null,
      media: [],
      activeIndex: 0,
    });
  }, [isEditMode, draftId, prefillCourse, prefillWhsScoreId, hydrate]);

  const [sheet, setSheet] = useState<null | 'course' | 'actor' | 'schedule' | 'drafts' | 'scheduled' | 'cover' | 'adjust' | 'round' | 'close-guard'>(null);

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

  const openDetail = useCallback((row: 'course' | 'round' | 'actor' | 'schedule') => {
    // Analytics callsite: post_detail_opened
    analyticsEvents.track('post_detail_opened', { mode, row });
  }, [mode]);


  // ---- C2: attach a logged round -----------------------------------------
  // Rounds are scoped to the PRIMARY tagged course only.
  const primaryCourseId = state.course?.id ?? null;
  const { data: myRounds } = useMyRoundsAtCourse(primaryCourseId);
  const roundsAtCourse = useMemo(() => myRounds ?? [], [myRounds]);
  const preselectAppliedFor = useRef<string | null>(null);

  // A round belongs to exactly one course. When the PRIMARY course changes -
  // to another club or to nothing - the attachment must go with it, otherwise
  // a post can carry course_id from club A and whs_score_id from club B.
  // `undefined` = first render, so an edit-mode restore is never wiped.
  const prevPrimaryCourseId = useRef<string | null | undefined>(undefined);
  const attachedRoundRef = useRef(state.attachedRound);
  attachedRoundRef.current = state.attachedRound;

  useEffect(() => {
    const prev = prevPrimaryCourseId.current;
    prevPrimaryCourseId.current = primaryCourseId;
    if (prev === undefined) return; // first mount (incl. edit-mode hydration)
    if (prev === primaryCourseId) return;
    if (skipNextCourseClearRef.current) {
      // Share-a-round prefill set the course and the round together.
      skipNextCourseClearRef.current = false;
      preselectAppliedFor.current = primaryCourseId;
      return;
    }

    // Let the new course run its own pre-selection.
    preselectAppliedFor.current = null;

    if (!attachedRoundRef.current) return;
    setAttachedRound(null);
    // Analytics callsite: post_round_detached - reported against the OLD
    // course so "course changed" is distinguishable from "member removed it".
    analyticsEvents.track('post_round_detached', {
      course_id: prev,
      reason: 'course_changed',
    });
  }, [primaryCourseId, setAttachedRound]);


  // Pre-selection: only a round played today or yesterday, and only once per
  // course. Visible and removable - never silent.
  useEffect(() => {
    if (isEditMode) return;
    if (!primaryCourseId || roundsAtCourse.length === 0) return;
    if (preselectAppliedFor.current === primaryCourseId) return;
    preselectAppliedFor.current = primaryCourseId;
    if (state.attachedRound) return;
    const pick = pickPreselectedRound(roundsAtCourse);
    if (pick) setAttachedRound(pick);
  }, [isEditMode, primaryCourseId, roundsAtCourse, state.attachedRound, setAttachedRound]);

  // Edit path: fill in the label detail for a restored attachment.
  useEffect(() => {
    const att = state.attachedRound;
    if (!att || att.playDate) return;
    const match = roundsAtCourse.find((r) => r.whsScoreId === att.whsScoreId);
    if (match) setAttachedRound(match);
  }, [state.attachedRound, roundsAtCourse, setAttachedRound]);

  const attachRoundLabel = state.attachedRound
    ? (state.attachedRound.playDate ? formatRoundLabel(state.attachedRound) : t('attachRound.attached'))
    : null;

  const openRoundSheet = useCallback(() => {
    openDetail('round');
    // Analytics callsite: post_round_attach_opened
    analyticsEvents.track('post_round_attach_opened', {
      course_id: primaryCourseId,
      rounds_available: roundsAtCourse.length,
    });
    setSheet('round');
  }, [primaryCourseId, roundsAtCourse.length, openDetail]);

  const handleSelectRound = useCallback((r: AttachedRound | null) => {
    setAttachedRound(r);
    if (r) {
      // Analytics callsite: post_round_attached
      analyticsEvents.track('post_round_attached', {
        course_id: primaryCourseId,
        days_since_round: r.playDate ? daysSinceRound(r.playDate) : null,
      });
    } else {
      // Analytics callsite: post_round_detached
      analyticsEvents.track('post_round_detached', { course_id: primaryCourseId });
    }
  }, [primaryCourseId, setAttachedRound]);


  // Post button vs Save button gating.
  const canSubmit = !submitting && !saving && (state.caption.trim().length > 0 || state.media.length > 0) && !!activeActor;

  // Edit-mode: schedule row visible only for still-scheduled posts.
  const showScheduleRow = !isEditMode || editStatus?.status === 'scheduled';

  const primaryLabel = isEditMode ? 'Save changes' : (state.scheduledAt ? 'Schedule' : 'Post');
  const primaryStyle: React.CSSProperties = {
    background: (!isEditMode && state.scheduledAt) ? '#F7931E' : '#15171F',
    color: (!isEditMode && state.scheduledAt) ? '#15171F' : '#F5F6F7',
    border: 0,
    borderRadius: 999,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: canSubmit ? 'pointer' : 'not-allowed',
    opacity: (canSubmit || submitting || saving) ? 1 : 0.4,
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
        whsScoreId: state.attachedRound?.whsScoreId ?? null,

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
        round_attached: !!state.attachedRound,
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
        whs_score_id: state.attachedRound?.whsScoreId ?? null,

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
        round_attached: !!state.attachedRound,
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
      <div style={{ position: 'fixed', inset: 0, background: '#F8FAFC', display: 'flex', flexDirection: 'column', zIndex: 12000 }}>
        <PostSuccessV2
          result={{ kind: 'published', postId: editPostId ?? '' }}
          onDone={() => { setSaveSuccess(false); onPosted?.(); onClose(); }}
        />
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#F8FAFC', display: 'flex', flexDirection: 'column', zIndex: 12000 }}>
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
      <div style={{ position: 'fixed', inset: 0, height: '100dvh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 12000 }}>
        {/* Header mirror: close X + "Edit post" title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', paddingTop: 'max(env(safe-area-inset-top), 12px)', background: '#F8FAFC', borderBottom: '1px solid rgba(0,0,0,0.07)', flex: 'none' }}>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 0, color: '#1F2428', cursor: 'pointer', padding: 8 }}>
            <X size={22} />
          </button>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2428' }}>Edit post</div>
          <div style={{ flex: 1 }} />
        </div>
        {/* Stage block */}
        <div style={{ flex: '1 1 0', minHeight: 0, padding: 12 }}>
          <div className="clb-shimmer-light" style={{ width: '100%', height: '100%', borderRadius: 16, background: 'rgba(0,0,0,0.06)' }} />
        </div>
        {/* Tray thumbs + caption bars */}
        <div style={{ flex: 'none', padding: '8px 12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="clb-shimmer-light" style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(0,0,0,0.06)' }} />
            <div className="clb-shimmer-light" style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(0,0,0,0.06)' }} />
            <div className="clb-shimmer-light" style={{ width: 64, height: 64, borderRadius: 12, background: 'rgba(0,0,0,0.06)' }} />
          </div>
          <div className="clb-shimmer-light" style={{ height: 14, width: '80%', borderRadius: 6, background: 'rgba(0,0,0,0.06)' }} />
          <div className="clb-shimmer-light" style={{ height: 14, width: '55%', borderRadius: 6, background: 'rgba(0,0,0,0.06)' }} />
        </div>
      </div>
    );
  }

  // Edit target failed to load or does not exist.
  if (isEditMode && !editable.isLoading && !editable.data) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 12000, padding: 24, gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2428' }}>Couldn't load this post</div>
        <div style={{ fontSize: 13, color: '#5A6270', textAlign: 'center' }}>It may have been deleted, or your connection dropped.</div>
        <button onClick={onClose} style={{ background: '#15171F', color: '#F5F6F7', border: 0, borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
      </div>
    );
  }

  // Ownership guard: if edit target isn't manageable, close out.
  if (isEditMode && editable.data && !editable.data.canManage) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 12000, padding: 24, gap: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2428' }}>Can't edit this post</div>
        <div style={{ fontSize: 13, color: '#5A6270', textAlign: 'center' }}>
          {editable.data.blockedReason === 'review-derived'
            ? 'Review posts are edited from the course page.'
            : "You don't have permission to edit this post."}
        </div>
        <button onClick={onClose} style={{ background: '#15171F', color: '#F5F6F7', border: 0, borderRadius: 999, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, height: '100dvh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 12000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', paddingTop: 'max(env(safe-area-inset-top), 12px)', background: '#F8FAFC', borderBottom: '1px solid rgba(0,0,0,0.07)', flex: 'none' }}>
        <button onClick={handleClose} aria-label="Close" style={{ background: 'transparent', border: 0, color: '#1F2428', cursor: 'pointer', padding: 8 }}>
          <X size={22} />
        </button>
        {isEditMode ? (
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2428' }}>Edit post</div>
        ) : drafts.drafts.length > 0 && (
          <button onClick={() => setSheet('drafts')} style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#1F2428', cursor: 'pointer' }}>
            Drafts - {drafts.drafts.length}
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={onPrimary} disabled={!canSubmit} style={primaryStyle}>
          {(submitting || saving)
            ? <Loader2 size={16} className="animate-spin" style={{ display: 'block' }} />
            : primaryLabel}
        </button>
      </div>

      <input ref={stageAddInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleStageAddFiles} />

      {/* Stage — shrinkable */}
      <div style={{ position: 'relative', flex: '1 1 0', minHeight: 0, display: 'flex' }}>
        <MediaStageV2
          item={active}
          index={state.activeIndex}
          total={state.media.length}
          onOpenAdjust={() => setSheet('adjust')}
          onOpenCover={() => setSheet('cover')}
          onRequestAdd={handleStageAdd}
        />
        {active && !active.existingId && (
          <FramePills value={active.frame} onChange={(f) => updateActive({ frame: f })} />
        )}
      </div>

      {/* Bottom stack — never grows the page; scrolls itself only if too tall */}
      <div style={{ flex: 'none', maxHeight: '55dvh', overflowY: 'auto', paddingBottom: 'max(env(safe-area-inset-bottom), 12px)', background: '#F8FAFC' }}>
        <MediaTray
          media={state.media}
          activeIndex={state.activeIndex}
          onSelect={setActiveIndex}
          onRemove={handleRemoveAt}
          onReorder={reorder}
          onAddFiles={handleAddFiles}
        />
        <CaptionField value={state.caption} onChange={handleSetCaption} currentUserId={profile?.id ?? null} />
        <DetailRows
          course={state.course}
          courses={state.courses}
          onOpenCourse={() => { openDetail('course'); setSheet('course'); }}
          actor={activeActor}
          onOpenActor={() => { openDetail('actor'); setSheet('actor'); }}
          scheduledAt={state.scheduledAt}
          onOpenSchedule={() => { openDetail('schedule'); setSheet('schedule'); }}
          actorLocked={isEditMode}
          showSchedule={showScheduleRow}
          showAttachRound={!!primaryCourseId && roundsAtCourse.length > 0}
          attachRoundLabel={attachRoundLabel}
          onOpenAttachRound={openRoundSheet}
        />

      </div>

      {/* Sheets */}
      <CourseTagSheet
        open={sheet === 'course'}
        onClose={() => setSheet(null)}
        onDone={setCourses}
        selected={state.courses}
        userId={profile?.id ?? null}
      />
      <AttachRoundSheet
        open={sheet === 'round'}
        onClose={() => setSheet(null)}
        rounds={roundsAtCourse}
        selectedId={state.attachedRound?.whsScoreId ?? null}
        onSelect={handleSelectRound}
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

      {/* Close guard */}
      <BottomSheet open={sheet === 'close-guard'} onClose={() => setSheet(null)} title="Unsaved changes">
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isEditMode && (
            <>
              {state.media.length > 0 && (
                <div style={{ fontSize: 12, fontWeight: 500, color: '#8A9099', marginBottom: 8, textAlign: 'center' }}>
                  {t('closeGuard.mediaNotSaved', { count: state.media.length })}
                </div>
              )}
              <button onClick={saveAsDraft} disabled={savingDraft} style={{ background: '#15171F', color: '#F5F6F7', border: 0, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: savingDraft ? 'not-allowed' : 'pointer', opacity: savingDraft ? 0.7 : 1 }}>{savingDraft ? 'Saving' : 'Save draft'}</button>
            </>
          )}
          <button onClick={() => { setSheet(null); reset(); onClose(); }} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', color: '#B00020' }}>Discard</button>
        </div>
      </BottomSheet>
    </div>
  );
}

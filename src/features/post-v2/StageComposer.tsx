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
import { X } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { useActiveActor } from '@/context/ActiveActorContext';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { setStatusBarStyleColor } from '@/hooks/useMedianStatusBar';
import { applyRouteChrome } from '@/lib/routeChrome';

import { useStageComposer, type StageMediaItem } from './hooks/useStageComposer';
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
import MediaTrimSheet from './components/MediaTrimSheet';
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
  const { activeActor, setActiveActor } = useActiveActor();
  const composer = useStageComposer();
  const { state, addFiles, removeAt, reorder, setActiveIndex, updateActive, setCaption, setCourse, setScheduledAt, restoreDraft, hydrate, reset } = composer;
  const { submit, submitting } = usePostSubmit();
  const drafts = useDrafts(profile?.id);
  const queryClient = useQueryClient();

  const isEditMode = !!editPostId;

  // Edit-mode load
  const editable = useEditablePost(editPostId ?? null);
  const [editStatus, setEditStatus] = useState<{ status: string | null; scheduledAt: string | null } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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
        setEditStatus({
          status: (data?.status as string | null) ?? null,
          scheduledAt: (data?.scheduled_at as string | null) ?? null,
        });
      });
    return () => { cancelled = true; };
  }, [editPostId]);

  // Composer is a light #F8FAFC surface -> dark status-bar icons.
  // On unmount, re-resolve chrome for the route underneath (Clubhouse dark,
  // Watch light, profile immersive, etc.) because overlay close is not a route change.
  useEffect(() => {
    try { setStatusBarStyleColor('dark', 'FFF8FAFC'); } catch {}
    return () => {
      try { applyRouteChrome(window.location.pathname, true); } catch {}
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
    const firstCourse = data.courses[0] ?? null;
    hydrate({
      caption: data.caption,
      course: firstCourse
        ? { id: firstCourse.courseId, name: firstCourse.courseName, country: firstCourse.country }
        : null,
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
      .select('id, actor_type, actor_id, content, course_id, course_name, course_country')
      .eq('id', draftId)
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        restoreDraft({
          caption: (data.content as string) ?? '',
          course: data.course_id && data.course_name
            ? { id: data.course_id as string, name: data.course_name as string, country: (data.course_country as string) ?? null }
            : null,
        });
      });
    return () => { cancelled = true; };
  }, [draftId, isEditMode, profile?.id, restoreDraft]);

  const [sheet, setSheet] = useState<null | 'course' | 'actor' | 'schedule' | 'drafts' | 'scheduled' | 'trim' | 'cover' | 'adjust' | 'close-guard'>(null);
  const [success, setSuccess] = useState<SubmitResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [scheduledCount, setScheduledCount] = useState<number>(0);

  const active = state.media[state.activeIndex] ?? null;

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
    opacity: canSubmit ? 1 : 0.4,
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
        scheduledAt: state.scheduledAt,
        actorType: activeActor.type,
        actorId: activeActor.id,
        authorName,
        authorAvatarUrl: authorAvatar,
        authorUsername,
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
      };
      // Only touch scheduled_at when the post is still scheduled.
      if (editStatus?.status === 'scheduled') {
        patch.scheduled_at = state.scheduledAt ? state.scheduledAt.toISOString() : null;
      }
      const { error: upErr } = await supabase.from('posts').update(patch as never).eq('id', editPostId);
      if (upErr) throw upErr;

      // Sync the single-course junction row to the primary course (best-effort;
      // full multi-course junction editing stays with useUpdatePost).
      await supabase.from('post_courses').delete().eq('post_id', editPostId);
      if (state.course?.id) {
        await supabase.from('post_courses').insert({
          post_id: editPostId,
          course_id: state.course.id,
          display_order: 0,
        } as never);
      }

      // Removed media rows: snapshot for cleanup, then delete.
      if (removedExistingIds.length > 0) {
        const { data: rows } = await supabase
          .from('post_media')
          .select('id, media_url, media_type, stream_id')
          .in('id', removedExistingIds);
        const snapshot = (rows ?? []).map((r: any) => ({
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

      setSaveSuccess(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }, [editPostId, editable.data, state, saving, editStatus, removedExistingIds, queryClient]);

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
    if (state.dirty && !isEditMode) {
      setSheet('close-guard');
      return;
    }
    onClose();
  };

  const saveAsDraft = async () => {
    if (!activeActor) return;
    await drafts.save({
      actorType: activeActor.type,
      actorId: activeActor.id,
      content: state.caption || null,
      courseId: state.course?.id ?? null,
      courseName: state.course?.name ?? null,
      courseCountry: state.course?.country ?? null,
    });
    setSheet(null);
    reset();
    onClose();
  };

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
        <PostSuccessV2 result={success} onDone={() => { setSuccess(null); onPosted?.(); }} />
      </div>
    );
  }

  const stageAddInputRef = useRef<HTMLInputElement>(null);
  const handleStageAdd = () => stageAddInputRef.current?.click();
  const handleStageAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) addFiles(files);
    e.target.value = '';
  };

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
        <button onClick={onPrimary} disabled={!canSubmit} style={primaryStyle}>{primaryLabel}</button>
      </div>

      <input ref={stageAddInputRef} type="file" accept="image/*,video/*" multiple hidden onChange={handleStageAddFiles} />

      {/* Stage — shrinkable */}
      <div style={{ position: 'relative', flex: '1 1 0', minHeight: 0, display: 'flex' }}>
        <MediaStageV2
          item={active}
          index={state.activeIndex}
          total={state.media.length}
          onOpenAdjust={() => setSheet('adjust')}
          onOpenTrim={() => setSheet('trim')}
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
          onAddFiles={addFiles}
        />
        <CaptionField value={state.caption} onChange={setCaption} currentUserId={profile?.id ?? null} />
        <DetailRows
          course={state.course}
          onOpenCourse={() => setSheet('course')}
          actor={activeActor}
          onOpenActor={() => setSheet('actor')}
          scheduledAt={state.scheduledAt}
          onOpenSchedule={() => setSheet('schedule')}
          actorLocked={isEditMode}
          showSchedule={showScheduleRow}
        />
      </div>

      {/* Sheets */}
      <CourseTagSheet open={sheet === 'course'} onClose={() => setSheet(null)} onSelect={setCourse} current={state.course} userId={profile?.id ?? null} />
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
        onRestore={(d) => restoreDraft({
          caption: d.content ?? '',
          course: d.course_id && d.course_name ? { id: d.course_id, name: d.course_name, country: d.course_country ?? null } : null,
        })}
        onDelete={drafts.remove}
      />
      <ScheduledPostsSheetV2
        open={sheet === 'scheduled'}
        onClose={() => setSheet(null)}
        userId={profile?.id}
        onCountChange={setScheduledCount}
      />
      <MediaTrimSheet
        open={sheet === 'trim'}
        onClose={() => setSheet(null)}
        item={active}
        onApply={(s, e) => updateActive({ trimStart: s, trimEnd: e })}
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
          <button onClick={saveAsDraft} style={{ background: '#15171F', color: '#F5F6F7', border: 0, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Save draft</button>
          <button onClick={() => { setSheet(null); reset(); onClose(); }} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', color: '#B00020' }}>Discard</button>
        </div>
      </BottomSheet>
    </div>
  );
}

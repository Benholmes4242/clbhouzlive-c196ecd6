// StageComposer - the shell of the P2 Stage composer.
//
// Owns: header, media stage + frame pills, media tray, caption field,
// detail rows, and orchestrates opening / closing every sheet.
// Delegates: state -> useStageComposer, submit -> usePostSubmit,
// drafts -> useDrafts, orchestration -> usePostUploadOrchestrator (via submit).

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { useActiveActor } from '@/context/ActiveActorContext';
import { toast } from 'sonner';

import { useStageComposer } from './hooks/useStageComposer';
import { usePostSubmit, type SubmitResult } from './hooks/usePostSubmit';
import { useDrafts } from './hooks/useDrafts';

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
import PostSuccessV2 from './components/PostSuccessV2';
import BottomSheet from './components/BottomSheet';

interface Props {
  onClose: () => void;
  onPosted?: () => void;
}

export default function StageComposer({ onClose, onPosted }: Props) {
  const { profile } = useProfileData();
  const { activeActor, setActiveActor } = useActiveActor();
  const composer = useStageComposer();
  const { state, addFiles, removeAt, reorder, setActiveIndex, updateActive, setCaption, setCourse, setScheduledAt, restoreDraft, reset } = composer;
  const { submit, submitting } = usePostSubmit();
  const drafts = useDrafts(profile?.id);

  const [sheet, setSheet] = useState<null | 'course' | 'actor' | 'schedule' | 'drafts' | 'scheduled' | 'trim' | 'cover' | 'close-guard'>(null);
  const [success, setSuccess] = useState<SubmitResult | null>(null);
  const [scheduledCount, setScheduledCount] = useState<number>(0);

  const active = state.media[state.activeIndex] ?? null;
  const canSubmit = !submitting && (state.caption.trim().length > 0 || state.media.length > 0) && !!activeActor;

  const postButtonLabel = state.scheduledAt ? 'Schedule' : 'Post';
  const postButtonStyle: React.CSSProperties = {
    background: state.scheduledAt ? '#F7931E' : '#15171F',
    color: state.scheduledAt ? '#15171F' : '#F5F6F7',
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

  const doSubmit = async () => {
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

  const handleClose = () => {
    if (state.dirty) {
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

  if (success) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#F8FAFC', display: 'flex', flexDirection: 'column', zIndex: 12000 }}>
        <PostSuccessV2 result={success} onDone={() => { setSuccess(null); onPosted?.(); }} />
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#F8FAFC', display: 'flex', flexDirection: 'column', zIndex: 12000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#F8FAFC', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <button onClick={handleClose} aria-label="Close" style={{ background: 'transparent', border: 0, color: '#1F2428', cursor: 'pointer', padding: 8 }}>
          <X size={22} />
        </button>
        <button onClick={() => setSheet('drafts')} style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '4px 10px', fontSize: 12, color: '#1F2428', cursor: 'pointer' }}>
          Drafts - {drafts.drafts.length}
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={doSubmit} disabled={!canSubmit} style={postButtonStyle}>{postButtonLabel}</button>
      </div>

      {/* Stage */}
      <div style={{ position: 'relative', flex: 1, minHeight: 240, display: 'flex' }}>
        <MediaStageV2
          item={active}
          index={state.activeIndex}
          total={state.media.length}
          onOpenAdjust={() => toast('Adjust: crop/reposition (P3)')}
          onOpenTrim={() => setSheet('trim')}
          onOpenCover={() => setSheet('cover')}
        />
        {active && (
          <FramePills value={active.frame} onChange={(f) => updateActive({ frame: f })} />
        )}
      </div>

      {/* Media tray */}
      <MediaTray
        media={state.media}
        activeIndex={state.activeIndex}
        onSelect={setActiveIndex}
        onRemove={removeAt}
        onReorder={reorder}
        onAddFiles={addFiles}
      />

      {/* Caption */}
      <CaptionField value={state.caption} onChange={setCaption} currentUserId={profile?.id ?? null} />

      {/* Detail rows */}
      <DetailRows
        course={state.course}
        onOpenCourse={() => setSheet('course')}
        actor={activeActor}
        onOpenActor={() => setSheet('actor')}
        scheduledAt={state.scheduledAt}
        onOpenSchedule={() => setSheet('schedule')}
      />

      {/* Sheets */}
      <CourseTagSheet open={sheet === 'course'} onClose={() => setSheet(null)} onSelect={setCourse} current={state.course} />
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

      {/* Close guard */}
      <BottomSheet open={sheet === 'close-guard'} onClose={() => setSheet(null)} title="Unsaved changes">
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={saveAsDraft} style={{ background: '#15171F', color: '#F5F6F7', border: 0, borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Save draft</button>
          <button onClick={() => { setSheet(null); reset(); onClose(); }} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer', color: '#B00020' }}>Discard</button>
        </div>
      </BottomSheet>
    </div>
  );
}
